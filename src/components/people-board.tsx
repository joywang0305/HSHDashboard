"use client";

import Image from "next/image";
import {
  formatPeopleDate,
  initialsFor,
  MOCK_PEOPLE_BOARD,
  type PeoplePerson,
} from "@/lib/people";

function PersonPhoto({ person }: { person: PeoplePerson }) {
  if (person.photoUrl) {
    return (
      <Image
        src={person.photoUrl}
        alt=""
        width={320}
        height={400}
        className="h-full w-full object-cover"
        unoptimized
      />
    );
  }
  return (
    <div
      className="flex h-full w-full items-center justify-center"
      style={{
        background:
          "linear-gradient(145deg, #0a5c59 0%, #004b49 55%, #002e2c 100%)",
      }}
      aria-hidden
    >
      <span
        className="text-4xl tracking-[0.08em] text-[#c5a44e] xl:text-5xl"
        style={{ fontFamily: "var(--font-cinzel), serif" }}
      >
        {initialsFor(person.name)}
      </span>
    </div>
  );
}

function PersonCard({
  person,
  accent,
}: {
  person: PeoplePerson;
  accent: "join" | "service";
}) {
  return (
    <article className="flex min-h-0 min-w-0 flex-col overflow-hidden border border-[#d9cdb8] bg-white">
      <div className="relative aspect-[4/5] w-full shrink-0 overflow-hidden bg-[#efe8da]">
        <PersonPhoto person={person} />
        {accent === "service" && person.years != null ? (
          <p className="absolute right-2 bottom-2 bg-[#004b49]/92 px-2 py-1 text-[11px] tracking-[0.16em] text-[#f7f3eb] uppercase">
            {person.years} years
          </p>
        ) : null}
      </div>
      <div className="flex min-h-0 flex-1 flex-col px-3 py-3 xl:px-4 xl:py-3.5">
        <h3
          className="truncate text-xl leading-tight font-medium text-[#004b49] xl:text-2xl"
          style={{ fontFamily: "var(--font-cormorant), serif" }}
        >
          {person.name}
        </h3>
        <p className="mt-1 truncate text-xs tracking-[0.12em] text-[#c5a44e] uppercase xl:text-sm">
          {person.title}
        </p>
        <p className="mt-2 truncate text-sm text-[#6b6458] xl:text-base">
          {person.division} · {person.capital}
        </p>
        <p className="mt-auto pt-2 text-xs tracking-[0.08em] text-[#6b6458] uppercase xl:text-sm">
          {accent === "join" ? "Joined" : "Since"} {formatPeopleDate(person.date)}
        </p>
      </div>
    </article>
  );
}

function PeopleSection({
  title,
  subtitle,
  people,
  accent,
}: {
  title: string;
  subtitle: string;
  people: PeoplePerson[];
  accent: "join" | "service";
}) {
  return (
    <section className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden border border-[#d9cdb8] bg-white">
      <header className="shrink-0 border-b border-[#d9cdb8] px-4 py-3 xl:px-5">
        <p className="text-[11px] tracking-[0.22em] text-[#c5a44e] uppercase xl:text-xs">
          {subtitle}
        </p>
        <h2
          className="text-2xl font-medium text-[#004b49] xl:text-3xl"
          style={{ fontFamily: "var(--font-cormorant), serif" }}
        >
          {title}
        </h2>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto p-3 md:p-4">
        {people.length === 0 ? (
          <p className="text-sm tracking-[0.12em] text-[#6b6458] uppercase">
            No colleagues to show
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:gap-4">
            {people.map((person) => (
              <PersonCard key={person.id} person={person} accent={accent} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export function PeopleBoard() {
  const board = MOCK_PEOPLE_BOARD;
  const joiners = board.newJoiners.filter((person) => !person.hidden);
  const service = board.longService.filter((person) => !person.hidden);

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-[#f7f3eb]">
      <header className="shrink-0 border-b border-[#d9cdb8] bg-white px-4 py-2.5 text-center xl:py-3">
        <p className="text-xs tracking-[0.32em] text-[#c5a44e] uppercase xl:text-sm">
          Colleagues across the Group
        </p>
        <h1
          className="text-3xl font-medium italic leading-tight text-[#004b49] xl:text-4xl 2xl:text-5xl"
          style={{ fontFamily: "var(--font-cormorant), serif" }}
        >
          People
        </h1>
      </header>
      <div className="grid min-h-0 flex-1 gap-2 p-2 md:grid-cols-2 md:p-3">
        <PeopleSection
          title="New joiners"
          subtitle="Welcome"
          people={joiners}
          accent="join"
        />
        <PeopleSection
          title="Long service"
          subtitle="Celebrating service"
          people={service}
          accent="service"
        />
      </div>
    </div>
  );
}
