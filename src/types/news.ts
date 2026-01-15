
export interface NewsEnclosure {
    url: string;
    type: string;
}

export interface NewsItem {
    id: string;
    title: string;
    description: string;
    formattedDescription: string;
    url: string;
    site: string | null;
    originalAuthor: string | null;
    author: string;
    date: string;
    enclosure?: NewsEnclosure;
    originalImage?: string;
    // Add other fields as needed based on the JSON
}

export interface NewsFeed {
    id: string;
    feed: {
        title: string;
        description: string;
        imageUrl: string | null;
        items: NewsItem[];
    };
    settings: any; // We likely won't need the settings for our custom view, but good to have a slot
}
