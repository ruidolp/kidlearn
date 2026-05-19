export interface GameEntry {
  id: string
  route: string
  icon: string
  nameKey: 'game_mc_name'           // clave en i18n
  descKey: 'game_mc_desc'
  available: boolean
  color: string                     // color de acento para la tarjeta
}

export const GAMES: GameEntry[] = [
  {
    id: 'mundo-cercano',
    route: '/mundo-cercano',
    icon: '🌍',
    nameKey: 'game_mc_name',
    descKey: 'game_mc_desc',
    available: true,
    color: 'var(--color-primary)',
  },
  // Próximos juegos — agregar aquí
  // { id: 'colores', route: '/colores', icon: '🎨', available: false, ... },
]
