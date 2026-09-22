#!/usr/bin/env python3
"""Temporary delegated Microsoft Graph login for local coding.

Uses device-code flow so a signed-in user (e.g. Joy Wang) can read SharePoint
lists such as PenterActive while the kiosk service principal waits for
Sites.Read.All / Sites.Selected.

This does NOT replace the production client-credentials flow in the Next.js app.

Usage:
  python3 scripts/graph-delegated.py login
  python3 scripts/graph-delegated.py whoami
  python3 scripts/graph-delegated.py penter
  python3 scripts/graph-delegated.py get /sites/root

Entra prerequisites (app registration for MICROSOFT_GRAPH_CLIENT_ID):
  - Delegated permission: Sites.Read.All (admin consent recommended)
  - Authentication → Allow public client flows = Yes
  - Optional: User.Read delegated
"""

from __future__ import annotations

import json
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ENV_PATH = ROOT / ".env"
CACHE_DIR = ROOT / ".cache"
TOKEN_PATH = CACHE_DIR / "graph-delegated-token.json"

SCOPES = " ".join(
    [
        "offline_access",
        "openid",
        "profile",
        "User.Read",
        "Sites.Read.All",
    ]
)


def load_env() -> dict[str, str]:
    env: dict[str, str] = {}
    if not ENV_PATH.exists():
        raise SystemExit(f"Missing {ENV_PATH}. Copy .env.example and fill Graph values.")
    for line in ENV_PATH.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        env[key.strip()] = value.strip().strip('"').strip("'")
    for key in ("MICROSOFT_GRAPH_TENANT_ID", "MICROSOFT_GRAPH_CLIENT_ID"):
        if not env.get(key):
            raise SystemExit(f"{key} is required in .env")
    return env


def post_form(url: str, fields: dict[str, str], *, raise_http: bool = True) -> dict:
    data = urllib.parse.urlencode(fields).encode()
    req = urllib.request.Request(
        url,
        data=data,
        headers={"Content-Type": "application/x-www-form-urlencoded"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=60) as response:
            return json.loads(response.read().decode() or "{}")
    except urllib.error.HTTPError as error:
        try:
            payload = json.loads(error.read().decode() or "{}")
        except Exception:
            payload = {"error": str(error), "error_description": str(error)}
        if not raise_http:
            payload.setdefault("http_status", error.code)
            return payload
        raise SystemExit(
            f"HTTP {error.code}: {payload.get('error_description') or payload.get('error') or payload}"
        ) from error


def graph_get(token: str, path: str) -> tuple[int, dict]:
    if not path.startswith("/"):
        path = "/" + path
    req = urllib.request.Request(
        f"https://graph.microsoft.com/v1.0{path}",
        headers={
            "Authorization": f"Bearer {token}",
            "Accept": "application/json",
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=60) as response:
            return response.status, json.loads(response.read().decode() or "{}")
    except urllib.error.HTTPError as error:
        try:
            payload = json.loads(error.read().decode() or "{}")
        except Exception:
            payload = {"error": {"message": str(error)}}
        return error.code, payload


def save_token(payload: dict) -> None:
    CACHE_DIR.mkdir(parents=True, exist_ok=True)
    expires_in = int(payload.get("expires_in") or 3600)
    record = {
        "access_token": payload["access_token"],
        "refresh_token": payload.get("refresh_token"),
        "expires_at": time.time() + expires_in - 60,
        "scope": payload.get("scope"),
        "token_type": payload.get("token_type"),
    }
    TOKEN_PATH.write_text(json.dumps(record, indent=2), encoding="utf-8")
    TOKEN_PATH.chmod(0o600)


def load_token_record() -> dict | None:
    if not TOKEN_PATH.exists():
        return None
    return json.loads(TOKEN_PATH.read_text(encoding="utf-8"))


def refresh_access_token(env: dict[str, str], refresh_token: str) -> dict:
    fields = {
        "client_id": env["MICROSOFT_GRAPH_CLIENT_ID"],
        "grant_type": "refresh_token",
        "refresh_token": refresh_token,
        "scope": SCOPES,
    }
    # Confidential clients may require the secret on refresh.
    if env.get("MICROSOFT_GRAPH_CLIENT_SECRET"):
        fields["client_secret"] = env["MICROSOFT_GRAPH_CLIENT_SECRET"]
    return post_form(
        f"https://login.microsoftonline.com/{env['MICROSOFT_GRAPH_TENANT_ID']}/oauth2/v2.0/token",
        fields,
    )


def access_token(env: dict[str, str], *, interactive: bool = True) -> str:
    record = load_token_record()
    if record and record.get("access_token") and record.get("expires_at", 0) > time.time():
        return record["access_token"]
    if record and record.get("refresh_token"):
        try:
            refreshed = refresh_access_token(env, record["refresh_token"])
            if refreshed.get("access_token"):
                save_token(refreshed)
                return refreshed["access_token"]
        except SystemExit as error:
            print(f"Refresh failed ({error}). Re-running device login…", file=sys.stderr)
    if not interactive:
        raise SystemExit("No delegated token. Run: python3 scripts/graph-delegated.py login")
    return cmd_login(env)


def cmd_login(env: dict[str, str]) -> str:
    tenant = env["MICROSOFT_GRAPH_TENANT_ID"]
    client_id = env["MICROSOFT_GRAPH_CLIENT_ID"]
    device = post_form(
        f"https://login.microsoftonline.com/{tenant}/oauth2/v2.0/devicecode",
        {"client_id": client_id, "scope": SCOPES},
    )
    print(device.get("message") or "Complete device sign-in.")
    print(f"\nVerification URI: {device.get('verification_uri')}")
    print(f"User code:        {device.get('user_code')}\n")
    interval = max(3, int(device.get("interval") or 5))
    expires = time.time() + int(device.get("expires_in") or 900)
    device_code = device["device_code"]
    while time.time() < expires:
        time.sleep(interval)
        fields = {
            "grant_type": "urn:ietf:params:oauth:grant-type:device_code",
            "client_id": client_id,
            "device_code": device_code,
        }
        if env.get("MICROSOFT_GRAPH_CLIENT_SECRET"):
            fields["client_secret"] = env["MICROSOFT_GRAPH_CLIENT_SECRET"]
        token = post_form(
            f"https://login.microsoftonline.com/{tenant}/oauth2/v2.0/token",
            fields,
            raise_http=False,
        )
        if token.get("access_token"):
            save_token(token)
            print(f"Delegated token saved to {TOKEN_PATH.relative_to(ROOT)}")
            print(f"Scopes: {token.get('scope')}")
            return token["access_token"]
        err = str(token.get("error") or "")
        desc = str(token.get("error_description") or "").lower()
        if err == "authorization_pending" or "authorization is pending" in desc:
            continue
        if err == "slow_down" or "slow down" in desc:
            interval += 2
            continue
        raise SystemExit(
            token.get("error_description") or token.get("error") or token
        )
    raise SystemExit("Device code expired. Run login again.")


def err_message(payload: dict) -> str:
    error = payload.get("error")
    if isinstance(error, dict):
        return f"{error.get('code')}: {error.get('message')}"
    return str(payload)[:300]


def cmd_whoami(env: dict[str, str]) -> None:
    token = access_token(env)
    status, me = graph_get(token, "/me?$select=displayName,mail,userPrincipalName,id")
    if status != 200:
        raise SystemExit(f"/me failed {status}: {err_message(me)}")
    print(
        f"Signed in as {me.get('displayName')} <{me.get('mail') or me.get('userPrincipalName')}>"
    )
    print(f"id={me.get('id')}")


def cmd_penter(env: dict[str, str]) -> None:
    token = access_token(env)
    status, site = graph_get(
        token, "/sites/hshgroup.sharepoint.com:/sites/PenterActive"
    )
    if status != 200:
        raise SystemExit(f"PenterActive site failed {status}: {err_message(site)}")
    site_id = site["id"]
    print(f"Site: {site.get('displayName')} ({site.get('webUrl')})")
    status, lists = graph_get(
        token,
        f"/sites/{site_id}/lists?$select=id,name,displayName,webUrl&$top=100",
    )
    if status != 200:
        raise SystemExit(f"Lists failed {status}: {err_message(lists)}")
    wanted = {
        "People": "New Joiners",
        "Service Anniversaries": "Anniversaries",
        "Who's In The Town": "Who's in Town",
        "Whos In The Town": "Who's in Town",
        "Video Stream": "CEO Video Stream",
        "RCM": "Careers RCM",
    }
    by_name = {}
    for item in lists.get("value") or []:
        for key in (item.get("displayName"), item.get("name")):
            if key:
                by_name[key] = item
    print(f"Lists on site: {len(lists.get('value') or [])}")
    for name, label in [
        ("People", "New Joiners"),
        ("Service Anniversaries", "Anniversaries"),
        ("Who's In The Town", "Who's in Town"),
        ("Video Stream", "CEO Video Stream"),
        ("RCM", "Careers RCM"),
    ]:
        lst = by_name.get(name)
        if not lst:
            for key, value in by_name.items():
                if key and name.lower() in key.lower():
                    lst = value
                    break
        if not lst:
            print(f"- {label}: not found")
            continue
        list_id = lst["id"]
        st, meta = graph_get(
            token,
            f"/sites/{site_id}/lists/{list_id}?$expand=columns($select=name,displayName)",
        )
        cols = []
        if st == 200:
            cols = [
                c.get("displayName") or c.get("name")
                for c in (meta.get("columns") or [])
            ][:10]
        st2, items = graph_get(
            token,
            f"/sites/{site_id}/lists/{list_id}/items?$top=5&$expand=fields",
        )
        if st2 != 200:
            print(f"- {label}: list ok, items FAIL {st2} {err_message(items)}")
            continue
        rows = items.get("value") or []
        more = "+" if items.get("@odata.nextLink") else ""
        field_keys = []
        if rows:
            field_keys = [
                key
                for key in (rows[0].get("fields") or {})
                if not str(key).startswith("@")
            ][:12]
        print(
            f"- {label}: READ OK display={lst.get('displayName')!r} "
            f"sample={len(rows)}{more} columns≈{cols} fields≈{field_keys}"
        )


def cmd_get(env: dict[str, str], path: str) -> None:
    token = access_token(env)
    status, payload = graph_get(token, path)
    print(f"HTTP {status}")
    print(json.dumps(payload, indent=2)[:8000])


def main(argv: list[str]) -> None:
    if len(argv) < 2 or argv[1] in {"-h", "--help", "help"}:
        print(__doc__)
        raise SystemExit(0)
    env = load_env()
    command = argv[1]
    if command == "login":
        cmd_login(env)
        cmd_whoami(env)
    elif command == "whoami":
        cmd_whoami(env)
    elif command == "penter":
        cmd_penter(env)
    elif command == "get":
        if len(argv) < 3:
            raise SystemExit("Usage: graph-delegated.py get /me")
        cmd_get(env, argv[2])
    else:
        raise SystemExit(f"Unknown command: {command}")


if __name__ == "__main__":
    main(sys.argv)
