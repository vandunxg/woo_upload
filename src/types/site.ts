export type SiteProfile = {
  id: string;
  name: string;
  baseUrl: string;
  createdAt: number;
  updatedAt: number;
};

export type SiteInput = {
  name?: string;
  baseUrl: string;
};
