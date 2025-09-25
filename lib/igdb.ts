import axios from 'axios';

interface IGDBGame {
  id: number;
  name: string;
  cover?: {
    url: string;
  };
  first_release_date?: number;
  platforms?: Array<{
    name: string;
  }>;
  summary?: string;
}

interface TwitchTokenResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
}

class IGDBClient {
  private clientId: string;
  private clientSecret: string;
  private accessToken: string | null = null;
  private tokenExpiresAt: number = 0;
  private baseURL = 'https://api.igdb.com/v4';

  constructor() {
    this.clientId = process.env.IGDB_ID || '';
    this.clientSecret = process.env.IGDB_SECRET || '';
  }

  private async getAccessToken(): Promise<string> {
    if (this.accessToken && Date.now() < this.tokenExpiresAt) {
      return this.accessToken;
    }

    try {
      console.log('Getting new IGDB access token...');
      const response = await axios.post<TwitchTokenResponse>(
        'https://id.twitch.tv/oauth2/token',
        null,
        {
          params: {
            client_id: this.clientId,
            client_secret: this.clientSecret,
            grant_type: 'client_credentials',
          },
        }
      );

      this.accessToken = response.data.access_token;
      this.tokenExpiresAt = Date.now() + (response.data.expires_in * 1000) - 60000; // Subtract 1 minute for safety
      
      console.log('IGDB access token obtained successfully');
      return this.accessToken;
    } catch (error) {
      console.error('Failed to get IGDB access token:', error);
      throw new Error('Failed to authenticate with IGDB');
    }
  }

  private async getHeaders() {
    const token = await this.getAccessToken();
    return {
      'Client-ID': this.clientId,
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json',
    };
  }

  async searchGames(query: string, limit: number = 10): Promise<IGDBGame[]> {
    try {
      const headers = await this.getHeaders();
      const response = await axios.post(
        `${this.baseURL}/games`,
        `search "${query}"; fields name,cover.url,first_release_date,platforms.name,summary; limit ${limit}; where version_parent = null;`,
        { headers }
      );
      return response.data;
    } catch (error) {
      console.error('IGDB search error:', error);
      return [];
    }
  }

  async getGameById(id: number): Promise<IGDBGame | null> {
    try {
      const headers = await this.getHeaders();
      const response = await axios.post(
        `${this.baseURL}/games`,
        `fields name,cover.url,first_release_date,platforms.name,summary; where id = ${id};`,
        { headers }
      );
      return response.data[0] || null;
    } catch (error) {
      console.error('IGDB get game error:', error);
      return null;
    }
  }

  formatCoverUrl(url: string): string {
    if (!url) return '';
    return url.replace('t_thumb', 't_cover_big');
  }
}

export const igdbClient = new IGDBClient();
export type { IGDBGame };
