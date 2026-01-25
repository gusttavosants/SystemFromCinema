export class Session {
  private readonly id: string;

  private readonly movieTitle: string;

  private readonly showTime: Date;

  private readonly room: string;

  private readonly totalSeats: number;

  private readonly price: number;

  private readonly createdAt: Date;

  private version: number = 0;

  constructor(
    id: string,
    movieTitle: string,
    showTime: Date,
    room: string,
    totalSeats: number,
    price: number,
    createdAt: Date = new Date(),
    version: number = 0,
  ) {
    if (totalSeats < 16) {
      throw new Error('Session must have at least 16 seats');
    }

    if (price <= 0) {
      throw new Error('Price must be positive');
    }

    if (showTime <= new Date()) {
      throw new Error('Show time must be in the future');
    }

    this.id = id;
    this.movieTitle = movieTitle;
    this.showTime = showTime;
    this.room = room;
    this.totalSeats = totalSeats;
    this.price = price;
    this.createdAt = createdAt;
    this.version = version;
  }

  getId(): string {
    return this.id;
  }

  getMovieTitle(): string {
    return this.movieTitle;
  }

  getShowTime(): Date {
    return new Date(this.showTime);
  }

  getRoom(): string {
    return this.room;
  }

  getTotalSeats(): number {
    return this.totalSeats;
  }

  getPrice(): number {
    return this.price;
  }

  getCreatedAt(): Date {
    return new Date(this.createdAt);
  }

  getVersion(): number {
    return this.version;
  }

  static create(
    id: string,
    movieTitle: string,
    showTime: Date,
    room: string,
    totalSeats: number,
    price: number,
  ): Session {
    return new Session(id, movieTitle, showTime, room, totalSeats, price);
  }

  static restore(
    id: string,
    movieTitle: string,
    showTime: Date,
    room: string,
    totalSeats: number,
    price: number,
    createdAt: Date,
    version: number,
  ): Session {
    return new Session(
      id,
      movieTitle,
      showTime,
      room,
      totalSeats,
      price,
      createdAt,
      version,
    );
  }
}
