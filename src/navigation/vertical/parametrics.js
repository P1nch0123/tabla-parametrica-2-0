// Usando keys de traducción que se procesarán por el componente de navegación
export default [
  { heading: 'parametrics' },
  {
    title: 'parametrics',
    icon: { icon: 'tabler-id' },
    children: [
      { title: 'weapons', to: 'pages-parametricas-armas-list' },
      
      // { title: 'units', to: 'pages-parametricas-unidades-list' }, // Comentado hasta crear la página
    ],
  },
]
