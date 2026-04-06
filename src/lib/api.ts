export interface University {
  name: string;
  country: string;
  alpha_two_code: string;
  web_pages: string[];
  domains: string[];
  state_province: string | null;
}

export const fetchUniversities = async (country: string, query?: string): Promise<University[]> => {
  const url = new URL('http://universities.hipolabs.com/search');
  url.searchParams.set('country', country);
  if (query) {
    url.searchParams.set('name', query);
  }

  const response = await fetch(url.toString(), {
    next: { revalidate: 3600 } // Cache for 1 hour
  });

  if (!response.ok) {
    throw new Error('Failed to fetch universities');
  }

  return response.json();
};

export const fetchUniversityByName = async (name: string): Promise<University | null> => {
  const url = new URL('http://universities.hipolabs.com/search');
  url.searchParams.set('name', name);

  const response = await fetch(url.toString());
  if (!response.ok) return null;

  const data: University[] = await response.json();
  // Find exact match if multiple partial matches
  return data.find(u => u.name === name) || data[0] || null;
};

export const getLogoUrl = (domain: string) => {
  return `https://logo.clearbit.com/${domain}?size=800`;
};

export const getFallbackLogoUrl = (domain: string) => {
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
};
