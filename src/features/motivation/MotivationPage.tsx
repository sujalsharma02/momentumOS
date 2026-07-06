import { motion } from "framer-motion";
import { Quote, RefreshCw } from "lucide-react";
import { useState } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { QUOTES } from "@/data/quotes";
import { DREAMS, REASONS_WHY } from "@/data/dreams";

function randomQuoteIndex(exclude?: number): number {
  let index = Math.floor(Math.random() * QUOTES.length);
  if (index === exclude) index = (index + 1) % QUOTES.length;
  return index;
}

export function MotivationPage() {
  const [quoteIndex, setQuoteIndex] = useState(() => randomQuoteIndex());
  const quote = QUOTES[quoteIndex];

  return (
    <div>
      <PageHeader
        title="Why You Started"
        description="For the days when the rejections pile up and the doubt gets loud."
      />

      {/* Random quote */}
      <motion.div
        key={quoteIndex}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass relative overflow-hidden rounded-2xl p-8 text-center sm:p-12"
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 -top-24 mx-auto h-48 w-96 rounded-full bg-violet-500/20 blur-3xl"
        />
        <Quote className="mx-auto h-8 w-8 text-primary" />
        <blockquote className="mx-auto mt-4 max-w-2xl text-xl font-medium leading-relaxed sm:text-2xl">
          “{quote.text}”
        </blockquote>
        <p className="mt-3 text-sm text-muted-foreground">— {quote.author}</p>
        <Button
          variant="outline"
          size="sm"
          className="mt-6"
          onClick={() => setQuoteIndex((current) => randomQuoteIndex(current))}
        >
          <RefreshCw /> Another one
        </Button>
      </motion.div>

      {/* Reasons */}
      <section className="mt-8">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Reasons I started
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {REASONS_WHY.map((reason, index) => (
            <motion.div
              key={reason}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.08 }}
            >
              <Card className="flex h-full items-start gap-3 p-5">
                <span className="tabular mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary">
                  {index + 1}
                </span>
                <p className="text-sm leading-relaxed">{reason}</p>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Dreams */}
      <section className="mt-8">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          The dreams
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {DREAMS.map((dream, index) => (
            <motion.div
              key={dream.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + index * 0.08 }}
              whileHover={{ y: -6, scale: 1.02 }}
            >
              <Card className="glass-hover h-full p-5 text-center">
                <div className="text-4xl">{dream.emoji}</div>
                <h3 className="mt-3 font-semibold">{dream.title}</h3>
                <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                  {dream.description}
                </p>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="mt-10 text-center text-sm text-muted-foreground"
      >
        Future you is already there, looking back at today —{" "}
        <span className="text-gradient font-semibold">don't let them down.</span>
      </motion.p>
    </div>
  );
}
