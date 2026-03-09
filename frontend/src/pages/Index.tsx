import { useState } from "react";
import { motion } from "framer-motion";
import { Search, Star, ChevronRight, Play, MessageSquare, HelpCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { MovieCard } from "@/components/MovieCard";
import { movies, testimonials, faqs } from "@/data/mock-data";
import heroBg from "@/assets/hero-cinema.jpg";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const Index = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const nowPlaying = movies.filter((m) => m.status === "em_cartaz");
  const comingSoon = movies.filter((m) => m.status === "em_breve");

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section className="relative flex min-h-[85vh] items-center justify-center overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${heroBg})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-background/30" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/80 via-transparent to-background/80" />

        <div className="relative z-10 container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="font-display text-5xl leading-tight text-foreground sm:text-7xl md:text-8xl">
              A MAGIA DO <span className="cinema-gradient-text">CINEMA</span>
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
              Viva experiências cinematográficas inesquecíveis. Escolha seu filme, reserve seu lugar e deixe-se envolver pela história.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="mx-auto mt-8 flex max-w-lg flex-col gap-3 sm:flex-row"
          >
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar filmes ou sessões..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-12 border-border bg-card/80 pl-10 backdrop-blur-sm placeholder:text-muted-foreground"
              />
            </div>
            <Link to="/filmes">
              <Button size="lg" className="h-12 bg-primary px-8 text-primary-foreground hover:bg-primary/90 cinema-glow">
                Buscar <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-8 flex items-center justify-center gap-6 text-sm text-muted-foreground"
          >
            <span className="flex items-center gap-1"><Play className="h-4 w-4 text-primary" /> {nowPlaying.length} filmes em cartaz</span>
            <span className="flex items-center gap-1"><Star className="h-4 w-4 text-accent" /> Salas IMAX & 3D</span>
          </motion.div>
        </div>
      </section>

      {/* Em Cartaz */}
      <section className="container mx-auto px-4 py-16">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <h2 className="font-display text-4xl text-foreground">EM CARTAZ</h2>
            <p className="text-muted-foreground">Os melhores filmes te esperando</p>
          </div>
          <Link to="/filmes" className="text-sm text-primary hover:underline">
            Ver todos <ChevronRight className="inline h-4 w-4" />
          </Link>
        </div>
        <div className="grid gap-6 grid-cols-2 md:grid-cols-4">
          {nowPlaying.map((movie, i) => (
            <MovieCard key={movie.id} movie={movie} index={i} />
          ))}
        </div>
      </section>

      {/* Em Breve */}
      {comingSoon.length > 0 && (
        <section className="container mx-auto px-4 py-16">
          <div className="mb-8">
            <h2 className="font-display text-4xl text-foreground">EM BREVE</h2>
            <p className="text-muted-foreground">Próximos lançamentos que você não pode perder</p>
          </div>
          <div className="grid gap-6 grid-cols-2 md:grid-cols-4">
            {comingSoon.map((movie, i) => (
              <MovieCard key={movie.id} movie={movie} index={i} />
            ))}
          </div>
        </section>
      )}

      {/* Depoimentos */}
      <section className="border-y border-border bg-card py-16">
        <div className="container mx-auto px-4">
          <div className="mb-8 text-center">
            <h2 className="font-display text-4xl text-foreground">O QUE NOSSOS CLIENTES DIZEM</h2>
            <p className="mt-2 text-muted-foreground">Experiências reais de quem já viveu a magia</p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {testimonials.map((t, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="cinema-card rounded-xl p-6"
              >
                <div className="mb-3 flex gap-1">
                  {Array.from({ length: t.rating }).map((_, j) => (
                    <Star key={j} className="h-4 w-4 fill-accent text-accent" />
                  ))}
                </div>
                <p className="text-sm text-muted-foreground">"{t.text}"</p>
                <p className="mt-3 text-sm font-medium text-foreground">{t.name}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="container mx-auto px-4 py-16">
        <div className="mx-auto max-w-2xl">
          <div className="mb-8 text-center">
            <h2 className="font-display text-4xl text-foreground">PERGUNTAS FREQUENTES</h2>
            <p className="mt-2 text-muted-foreground">Tire suas dúvidas</p>
          </div>
          <Accordion type="single" collapsible className="space-y-2">
            {faqs.map((faq, i) => (
              <AccordionItem
                key={i}
                value={`faq-${i}`}
                className="cinema-card rounded-xl border-none px-6"
              >
                <AccordionTrigger className="text-sm text-foreground hover:text-primary hover:no-underline">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;
