# Design System Specification: The Gentle Navigator

## 1. Overview & Creative North Star
**Creative North Star: "The Tactile Sanctuary"**

This design system rejects the cold, sterile aesthetic of traditional medical platforms in favor of a "Tactile Sanctuary." Our goal is to create a digital environment that feels as safe and welcoming as a well-appointed sensory room. We move beyond the "template" look by utilizing organic asymmetry, soft tonal layering, and an editorial approach to whitespace. 

By prioritizing "Low-Arousal Design," we reduce cognitive load for parents and children alike. We achieve a premium feel not through complexity, but through the extreme intentionality of our surfaces. Elements don't just sit on a page; they rest in a curated, three-dimensional space that feels breathable and calm.

---

## 2. Colors & Surface Architecture

### The Palette
The palette is rooted in nature—earthy greens, serene blues, and soft sun-yellows—designed to be high-contrast for accessibility but low-vibrancy for sensory comfort.

*   **Primary (`#176876`):** Our "Deep Sea" anchor, used for moments of authority and primary actions.
*   **Secondary (`#3e684a`):** "Sage Leaf," representing growth and calm.
*   **Tertiary (`#725d00`):** "Golden Ochre," used sparingly for warmth and gentle highlights.
*   **Neutral Surfaces:** The foundation is `surface` (`#fbf9f5`), a warm off-white that prevents the "snow blindness" caused by pure #FFFFFF.

### The "No-Line" Rule
**Borders are strictly prohibited for sectioning.** To separate content, designers must use background color shifts. For example, a main content area might sit on `surface-container-low`, while a sidebar or navigation element sits on `surface-container-highest`. This creates a sophisticated, "editorial" look that feels cohesive rather than fragmented.

### Surface Hierarchy & Nesting
Treat the UI as a series of nested physical layers. 
1.  **Base Layer:** `surface` or `surface-container-lowest`.
2.  **Card/Container Layer:** `surface-container-low`.
3.  **Active/Interaction Layer:** `surface-container-high`.

### The Glass & Gradient Rule
To prevent a "flat" or "cheap" feel, main CTAs and hero headers should utilize subtle linear gradients—transitioning from `primary` to `primary_container`. For floating elements (like modals or sticky navigation), apply **Glassmorphism**: use a semi-transparent `surface` color with a `backdrop-filter: blur(20px)`. This integrates the UI into the environment rather than making it feel like an overlay.

---

## 3. Typography: Editorial Clarity

We use a duo-font system to balance character with extreme legibility.

*   **Display & Headlines (Plus Jakarta Sans):** A modern sans-serif with wide apertures. Use `display-lg` (3.5rem) for hero moments to create an "Editorial" impact. Bold weight should be used sparingly to maintain a "gentle" voice.
*   **Body & Titles (Lexend):** Specifically designed to reduce visual stress and improve reading speed. 
    *   **Body-lg (`1rem`):** The standard for all screening questions.
    *   **Title-md (`1.125rem`):** Used for card headers and section titles.

**Hierarchy Note:** High-contrast scale is key. A `display-sm` headline paired with a `body-md` description creates a professional, intentional imbalance that looks "designed" rather than "default."

---

## 4. Elevation & Depth: Tonal Layering

Traditional drop shadows are often too "noisy" for sensory-sensitive users. We use **Tonal Layering** as the primary driver of depth.

*   **The Layering Principle:** Instead of a shadow, place a `surface-container-lowest` card on a `surface-container-low` background. The slight shift in hex value provides enough "lift" for the eye without adding visual clutter.
*   **Ambient Shadows:** If a floating state is required (e.g., a button hover), use a shadow with a 32px blur and 4% opacity. The color should be a tinted `on-surface` (`#31332f`), never pure black.
*   **The "Ghost Border" Fallback:** If accessibility requires a stroke (e.g., in high-contrast mode), use the `outline-variant` token at 15% opacity. It should be felt, not seen.
*   **Roundedness:** We lean into the "xl" (`3rem`) and "full" (`9999px`) tokens for large containers and buttons to remove all "sharpness" from the experience.

---

## 5. Components

### Buttons
*   **Primary:** `primary` fill with `on_primary` text. Use `xl` (3rem) rounded corners. Use a subtle gradient to `primary_dim` for a soft 3D effect.
*   **Secondary:** `secondary_container` fill. No border.
*   **Tertiary:** Ghost style using `primary` text. No fill, no border.

### Input Fields
*   **Styling:** Use `surface_container_highest` as the fill. 
*   **States:** On focus, the background shifts to `surface_bright` with a 2px `primary` "Ghost Border" (20% opacity).
*   **Forbid:** Never use a bottom-line-only input or a harsh 1px black border.

### Cards & Progress Trackers
*   **No Dividers:** Separate list items with `1.5rem` (Spacing md) of whitespace or alternating tonal backgrounds (`surface-container-low` vs `surface-container-lowest`).
*   **Progress Trackers:** Use thick, `full-rounded` bars. The track should be `surface_container_highest` and the progress should be a `secondary` to `secondary_fixed_dim` gradient.

### Screening Cards
Specialized containers for autism screening questions. They should use `lg` (2rem) corners and be generously padded (`2.5rem`). This ensures the user focuses on one question at a time.

---

## 6. Do’s and Don’ts

### Do:
*   **Do** use asymmetrical layouts for illustrations to make the app feel "human" and "hand-crafted."
*   **Do** allow for "Breathing Room." If you think there is enough whitespace, add 20% more.
*   **Do** use `lexend` for all data-heavy or instructional text to support neurodivergent readers.
*   **Do** use friendly, simple illustrations with rounded, blob-like shapes and colors from the `tertiary_container` and `secondary_container` palettes.

### Don't:
*   **Don't** use 1px solid borders to separate sections.
*   **Don't** use pure black (`#000000`) for text; use `on_surface` (`#31332f`) to reduce visual "vibration."
*   **Don't** use "Sharp" corners (anything less than `0.5rem`).
*   **Don't** use rapid or "snappy" animations. Transitions should be soft (e.g., 300ms Ease-Out).

---

## 7. Signature Illustrations & Iconography
Icons should be "Soft-Stroke"—using `2px` or `3px` weights with rounded caps and joins. Illustrations should avoid complex patterns; use flat, overlapping shapes in `secondary_container` and `tertiary_fixed` to create friendly characters or abstract safety shapes. These should never distract from the task, but rather act as "Visual Anchors" at the end of a process.