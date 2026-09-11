import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatPrice } from "@/lib/format";

interface ServiceTeaser {
  id: string;
  name: string;
  price_cents: number;
  duration_minutes: number;
}

export default async function HomePage() {
  const supabase = await createClient();
  const { data: services } = await supabase
    .from("services")
    .select("id, name, price_cents, duration_minutes")
    .eq("active", true)
    .order("duration_minutes", { ascending: true });

  const featuredServices = (services ?? []) as ServiceTeaser[];

  return (
    <>
      <section className="bg-ink text-cream">
        <div className="mx-auto flex max-w-5xl flex-col gap-10 px-6 py-16 md:flex-row md:items-center md:py-24">
          <div className="relative aspect-[3/4] w-full max-w-sm overflow-hidden rounded-sm md:w-2/5">
            <Image
              src="/images/Juliana_2.jpg"
              alt="Juliana, profissional do Beauty Day"
              fill
              priority
              className="object-cover"
              sizes="(min-width: 768px) 40vw, 90vw"
            />
          </div>
          <div className="flex flex-col gap-6 md:w-3/5">
            <p className="font-sans text-sm text-sand">Beauty Day Juliana</p>
            <h1 className="font-display text-4xl leading-tight md:text-5xl">
              Beleza é ter um horário guardado só pra você.
            </h1>
            <p className="max-w-md font-sans text-base leading-relaxed text-sand">
              Corte, coloração, escova. Escolha o serviço, veja o horário livre
              e confirme — sem trocar mensagem no WhatsApp.
            </p>
            <Link
              href="/agendar"
              className="w-fit rounded-sm bg-clay px-6 py-3 font-sans text-sm font-medium text-cream transition-colors hover:bg-clay-dark"
            >
              Agendar meu horário
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-6 py-16">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
          <div className="relative aspect-square w-24 shrink-0 overflow-hidden rounded-full">
            <Image
              src="/images/Juliana_1.jpg"
              alt="Juliana no dia a dia do salão"
              fill
              className="object-cover"
              sizes="96px"
            />
          </div>
          <p className="font-sans text-ink-soft">
            Sou a Juliana — atendo sozinha, com hora marcada, pra dar atenção
            de verdade a cada cliente.
          </p>
        </div>
      </section>

      {featuredServices.length > 0 && (
        <section className="mx-auto max-w-3xl px-6 pb-16">
          <h2 className="font-display text-2xl text-ink">Serviços</h2>
          <ul className="mt-6 divide-y divide-sand/60 border-y border-sand/60">
            {featuredServices.map((service) => (
              <li
                key={service.id}
                className="flex items-baseline justify-between gap-4 py-4 font-sans"
              >
                <span className="text-ink">{service.name}</span>
                <span className="whitespace-nowrap text-sm text-ink-soft">
                  {formatPrice(service.price_cents)} · {service.duration_minutes} min
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <footer className="border-t border-sand/60 px-6 py-10">
        <div className="mx-auto flex max-w-3xl flex-col gap-2 font-sans text-sm text-ink-soft">
          <p className="text-ink">Beauty Day Juliana</p>
          <p>WhatsApp: (11) 90000-0000</p>
          <p>Instagram: @beautydayjuliana</p>
        </div>
      </footer>
    </>
  );
}
