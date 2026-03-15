export abstract class AggregateRoot<TSnapshot extends { id: number | null }, TEvent> {
  protected readonly props: TSnapshot
  private domainEvents: TEvent[] = []

  protected constructor(props: TSnapshot) {
    this.props = props
  }

  get id() {
    return this.props.id
  }

  assignId(id: number) {
    this.props.id = id
  }

  pullDomainEvents(): TEvent[] {
    const events = [...this.domainEvents]
    this.domainEvents = []
    return events
  }

  protected record(event: TEvent) {
    this.domainEvents.push(event)
  }

  protected requireId(message: string): number {
    if (this.props.id === null) {
      throw new Error(message)
    }

    return this.props.id
  }
}
