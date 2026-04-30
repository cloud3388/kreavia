export const FONT_MAP = {
  luxury: {
    headline: ['Cormorant Garamond', 'Playfair Display', 'DM Serif Display', 'Libre Baskerville', 'Bodoni Moda', 'Crimson Pro'],
    body: ['Inter', 'Jost', 'Raleway', 'Montserrat', 'DM Sans']
  },
  minimal: {
    headline: ['Inter', 'DM Sans', 'Outfit', 'Plus Jakarta Sans', 'Manrope', 'Space Grotesk'],
    body: ['Inter', 'Source Sans 3', 'Nunito Sans', 'IBM Plex Sans', 'Figtree']
  },
  bold: {
    headline: ['Montserrat', 'Oswald', 'Barlow Condensed', 'Anton', 'Bebas Neue', 'Black Han Sans', 'Kanit'],
    body: ['Montserrat', 'Barlow', 'Source Sans 3', 'Nunito']
  },
  playful: {
    headline: ['Poppins', 'Nunito', 'Quicksand', 'Fredoka', 'Baloo 2', 'Righteous', 'Comfortaa'],
    body: ['Poppins', 'Nunito', 'Quicksand', 'Lato', 'Mulish']
  },
  'dark aesthetic': {
    headline: ['Cormorant', 'Josefin Sans', 'Cinzel', 'Italiana', 'Tenor Sans', 'Poiret One'],
    body: ['Josefin Sans', 'Raleway', 'Montserrat', 'Lato', 'Source Sans 3']
  }
};

const getRandomFont = (list, previous) => {
  const available = list.filter(f => f !== previous);
  if (available.length === 0) return list[0];
  return available[Math.floor(Math.random() * available.length)];
};

export const pickFonts = (style = 'minimal', previous = {}) => {
  const normalizedStyle = style.toLowerCase();
  const maps = FONT_MAP[normalizedStyle] || FONT_MAP.minimal;
  
  const headline = getRandomFont(maps.headline, previous.heading || previous.headline);
  const body = getRandomFont(maps.body, previous.body);
  
  const availableUi = ['Inter', 'DM Sans'].filter(f => f !== previous.ui);
  const ui = availableUi.length ? availableUi[Math.floor(Math.random() * availableUi.length)] : 'Inter';
  
  return { 
    headline, 
    heading: headline, // Keep heading for backwards compatibility with some components if needed
    body, 
    accent: ui, // Legacy accent property
    ui, 
    rationale: `Perfect typography pairing specifically curated for the ${style} aesthetic.` 
  };
};
