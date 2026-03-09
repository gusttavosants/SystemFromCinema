import movie1 from "@/assets/movie-1.jpg";
import movie2 from "@/assets/movie-2.jpg";
import movie3 from "@/assets/movie-3.jpg";
import movie4 from "@/assets/movie-4.jpg";
import movie5 from "@/assets/movie-5.jpg";
import movie6 from "@/assets/movie-6.jpg";

export interface Movie {
  id: string;
  title: string;
  poster: string;
  genre: string[];
  duration: number;
  rating: string;
  synopsis: string;
  director: string;
  cast: string[];
  releaseDate: string;
  trailerUrl: string;
  score: number;
  status: "em_cartaz" | "em_breve" | "arquivado";
}

export interface Session {
  id: string;
  movieId: string;
  roomId: string;
  roomName: string;
  roomType: string;
  date: string;
  time: string;
  price: number;
  halfPrice: number;
  availableSeats: number;
  totalSeats: number;
}

export interface Room {
  id: string;
  name: string;
  capacity: number;
  type: string;
  rows: number;
  seatsPerRow: number;
}

export const movies: Movie[] = [
  {
    id: "1",
    title: "Horizonte Final",
    poster: movie1,
    genre: ["Ficção Científica", "Ação"],
    duration: 142,
    rating: "14",
    synopsis: "Em um futuro distante, a humanidade enfrenta sua maior ameaça quando uma anomalia espacial começa a consumir galáxias inteiras. Um grupo de astronautas embarca em uma missão suicida para salvar a civilização.",
    director: "Carlos Mendes",
    cast: ["João Silva", "Maria Santos", "Pedro Costa"],
    releaseDate: "2026-03-01",
    trailerUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    score: 8.7,
    status: "em_cartaz",
  },
  {
    id: "2",
    title: "Depois do Amanhecer",
    poster: movie2,
    genre: ["Romance", "Drama"],
    duration: 118,
    rating: "12",
    synopsis: "Dois estranhos se encontram em uma praia deserta e descobrem que suas vidas estão conectadas de maneiras que nunca imaginaram. Uma história de amor e autodescoberta.",
    director: "Ana Ribeiro",
    cast: ["Laura Mendes", "Rafael Torres", "Clara Oliveira"],
    releaseDate: "2026-02-14",
    trailerUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    score: 7.9,
    status: "em_cartaz",
  },
  {
    id: "3",
    title: "A Sombra",
    poster: movie3,
    genre: ["Terror", "Suspense"],
    duration: 105,
    rating: "16",
    synopsis: "Uma família se muda para uma casa isolada na floresta, mas logo descobre que algo antigo e maligno habita as sombras entre as árvores. O terror começa quando o sol se põe.",
    director: "Bruno Ferreira",
    cast: ["Camila Rocha", "Diego Almeida", "Fernanda Lima"],
    releaseDate: "2026-03-07",
    trailerUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    score: 8.2,
    status: "em_cartaz",
  },
  {
    id: "4",
    title: "Reino Perdido",
    poster: movie4,
    genre: ["Animação", "Aventura"],
    duration: 95,
    rating: "L",
    synopsis: "Um jovem explorador descobre um portal para um reino mágico escondido na selva amazônica, onde criaturas fantásticas lutam para proteger seu lar de uma ameaça misteriosa.",
    director: "Estúdio Animare",
    cast: ["Voz: Lucas Prado", "Voz: Beatriz Campos"],
    releaseDate: "2026-03-15",
    trailerUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    score: 8.5,
    status: "em_cartaz",
  },
  {
    id: "5",
    title: "Caos Total",
    poster: movie5,
    genre: ["Comédia"],
    duration: 98,
    rating: "12",
    synopsis: "Quando um erro no sistema de reservas coloca três casamentos, uma formatura e um festival de rock no mesmo local e na mesma data, o caos se instala de maneira hilária.",
    director: "Marcos Souza",
    cast: ["Tatiana Vega", "Ricardo Nunes", "Patrícia Melo"],
    releaseDate: "2026-04-01",
    trailerUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    score: 7.3,
    status: "em_breve",
  },
  {
    id: "6",
    title: "Vingança",
    poster: movie6,
    genre: ["Ação", "Suspense"],
    duration: 130,
    rating: "16",
    synopsis: "Após perder tudo, um ex-agente secreto retorna das cinzas para enfrentar a organização criminosa que destruiu sua vida. A vingança é um prato que se serve gelado.",
    director: "Felipe Cardoso",
    cast: ["André Martins", "Juliana Reis", "Henrique Bastos"],
    releaseDate: "2026-04-10",
    trailerUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    score: 8.0,
    status: "em_breve",
  },
];

export const sessions: Session[] = [
  { id: "s1", movieId: "1", roomId: "r1", roomName: "Sala 1", roomType: "IMAX", date: "2026-03-09", time: "14:00", price: 45, halfPrice: 22.5, availableSeats: 120, totalSeats: 180 },
  { id: "s2", movieId: "1", roomId: "r2", roomName: "Sala 2", roomType: "3D", date: "2026-03-09", time: "17:00", price: 35, halfPrice: 17.5, availableSeats: 85, totalSeats: 150 },
  { id: "s3", movieId: "1", roomId: "r1", roomName: "Sala 1", roomType: "IMAX", date: "2026-03-09", time: "20:30", price: 50, halfPrice: 25, availableSeats: 45, totalSeats: 180 },
  { id: "s4", movieId: "2", roomId: "r3", roomName: "Sala 3", roomType: "2D", date: "2026-03-09", time: "15:00", price: 28, halfPrice: 14, availableSeats: 100, totalSeats: 120 },
  { id: "s5", movieId: "2", roomId: "r3", roomName: "Sala 3", roomType: "2D", date: "2026-03-09", time: "19:00", price: 32, halfPrice: 16, availableSeats: 60, totalSeats: 120 },
  { id: "s6", movieId: "3", roomId: "r2", roomName: "Sala 2", roomType: "3D", date: "2026-03-09", time: "21:00", price: 38, halfPrice: 19, availableSeats: 30, totalSeats: 150 },
  { id: "s7", movieId: "3", roomId: "r1", roomName: "Sala 1", roomType: "IMAX", date: "2026-03-10", time: "22:00", price: 50, halfPrice: 25, availableSeats: 150, totalSeats: 180 },
  { id: "s8", movieId: "4", roomId: "r3", roomName: "Sala 3", roomType: "2D", date: "2026-03-09", time: "14:00", price: 25, halfPrice: 12.5, availableSeats: 90, totalSeats: 120 },
  { id: "s9", movieId: "4", roomId: "r2", roomName: "Sala 2", roomType: "3D", date: "2026-03-09", time: "16:30", price: 30, halfPrice: 15, availableSeats: 110, totalSeats: 150 },
];

export const rooms: Room[] = [
  { id: "r1", name: "Sala 1 - IMAX", capacity: 180, type: "IMAX", rows: 12, seatsPerRow: 15 },
  { id: "r2", name: "Sala 2 - 3D", capacity: 150, type: "3D", rows: 10, seatsPerRow: 15 },
  { id: "r3", name: "Sala 3 - Standard", capacity: 120, type: "2D", rows: 10, seatsPerRow: 12 },
];

export const testimonials = [
  { name: "Ana Clara", text: "Melhor experiência de cinema da cidade! A sala IMAX é incrível.", rating: 5 },
  { name: "Roberto Silva", text: "Comprar ingressos online nunca foi tão fácil. Recomendo!", rating: 5 },
  { name: "Mariana Costa", text: "As poltronas são super confortáveis e o som é impecável.", rating: 4 },
  { name: "Lucas Pereira", text: "Sempre encontro os melhores filmes aqui. Virei cliente fiel!", rating: 5 },
];

export const faqs = [
  { question: "Como compro meu ingresso?", answer: "Basta escolher o filme, selecionar a sessão e os assentos desejados, e finalizar o pagamento online. Você receberá um QR Code para apresentar na entrada." },
  { question: "Posso cancelar minha compra?", answer: "Sim, cancelamentos podem ser feitos até 2 horas antes da sessão. O valor será estornado na mesma forma de pagamento." },
  { question: "Quais formas de pagamento são aceitas?", answer: "Aceitamos cartão de crédito, débito, PIX e carteiras digitais como Apple Pay e Google Pay." },
  { question: "O que é meia-entrada?", answer: "Estudantes, idosos e pessoas com deficiência têm direito à meia-entrada mediante apresentação de documento comprobatório." },
  { question: "Posso escolher meu assento?", answer: "Sim! Nosso mapa interativo permite que você escolha exatamente onde quer sentar." },
];

export const adminStats = {
  todaySales: 12450,
  weekSales: 78320,
  monthSales: 345600,
  occupancyRate: 73,
  ticketsSold: 1247,
  activeSessions: 8,
  salesByHour: [
    { hour: "10h", value: 450 },
    { hour: "12h", value: 820 },
    { hour: "14h", value: 1200 },
    { hour: "16h", value: 980 },
    { hour: "18h", value: 1500 },
    { hour: "20h", value: 2100 },
    { hour: "22h", value: 1800 },
  ],
  topMovies: [
    { name: "Horizonte Final", tickets: 456 },
    { name: "A Sombra", tickets: 312 },
    { name: "Reino Perdido", tickets: 289 },
    { name: "Depois do Amanhecer", tickets: 190 },
  ],
  occupancyByRoom: [
    { name: "Sala 1 - IMAX", rate: 85 },
    { name: "Sala 2 - 3D", rate: 72 },
    { name: "Sala 3 - Standard", rate: 64 },
  ],
};
