//# Implementation Plan - Custom News Page

This plan outlines the steps to replace the iframe-based news feed with a custom, native React implementation using the provided JSON data structure.

## 1. Data Structure & Mock Data

-   Create a TypeScript interface `NewsItem` matching the JSON structure (id, title, description, formattedDescription, url, site, date, enclosure key for images, etc.).
-   Create a local mock data file `src/data/newsData.ts` containing the provided JSON response. This allows us to develop the UI immediately without depending on the live API initially (and avoids CORS/proxy issues during dev).
-   *Note*: The user requested to use "this response data", implying we should hardcode it or use it as the initial state. I will set up a service pattern so we *could* fetch it, but default to this data for now to guarantee the requested view.

## 2. Component Structure

We will refactor `src/pages/News.tsx` to remove the iframe and instead render a grid of news cards.

-   **NewsPage (Container)**:
    -   Already exists, will be updated.
    -   Retain the existing `DashboardLayout` and `Header` structure (Title "News", Description).
    -   Retain the premium styling (dark background `#0A0A0A`, gradients, borders).
    -   Replace `motion.div` that held the iframe with a `div` containing a Grid.

-   **NewsGrid (Layout)**:
    -   CSS Grid: `grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4`.
    -   Gap: `gap-6`.
    -   Responsive adjustments.

-   **NewsCard (Component)**:
    -   **Container**: `motion.div` for hover effects.
    -   **Visuals**:
        -   Background: Transparent or very subtle `bg-white/5` on hover.
        -   Border: `border-white/10` rounded-xl.
        -   Shadow: Subtle shadow, deeper on hover.
    -   **Content**:
        -   **Image**: Top section. Use `enclosure.url` or `originalImage`. Fallback logic if missing. Aspect ratio e.g., 16:9.
        -   **Source/Date Badge**: Small text/badge (e.g., "Law360 • 2h ago").
        -   **Title**: Bold, white text, truncated to 2-3 lines.
        -   **Description**: Subtle grey text (`text-white/60`), truncated.

## 3. Styling & Theming

-   **Background**: Ensure the cards sit perfectly on the `#0A0A0A` background.
-   **Typography**: Use the app's standard fonts. Title generally `text-lg font-semibold`.
-   **Interactions**:
    -   Hover: Slight scale up (`scale-105`), scaling border brightness.
    -   Click: Open `url` in new tab.

## 4. Implementation Steps

1.  **Create Interfaces**: Define `NewsFeed` and `NewsItem` types.
2.  **Create Mock Data**: Add the provided JSON to a variable/file.
3.  **Build NewsCard**: Implement the individual card component with Framer Motion.
4.  **Refactor NewsPage**:
    -   Remove `<iframe>`.
    -   Map over the data array.
    -   Render `NewsCard` for each item.
    -   Apply `scrollbar-hide` or custom scrollbar to the main container if scrolling is needed internally, or let the page scroll (User preference seems to be page scrolling based on previous "zoom" fixes, but we'll stick to the "Dashboard" feel which usually implies a scrollable area *within* the layout).

## 5. Refinement

-   Check for "scrollbar" issues (the user previously mentioned zooming issues). We will ensure the container has proper `overflow-y-auto` and uses the custom scrollbar class if needed, or just standard page scrolling.
-   Verify responsive behavior (mobile stack vs desktop grid).

## 6. Verification

-   Verify the card matches the "dark theme" perfectly (no white flashes).
-   Check image loading (handle broken URLs gracefully).

