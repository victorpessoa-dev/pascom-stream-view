export default function manifest() {
  return {
    name: "Virtus PlayCast",
    short_name: "Virtus",
    description: "Transmissão de missas e celebrações religiosas da paróquia",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#f8fbff",
    theme_color: "#f8fbff",
    lang: "pt-BR",
    categories: ["religion", "video"],
    icons: [
      {
        src: "/brand/virtus-playcast-mark.png",
        sizes: "1024x1024",
        type: "image/png",
        purpose: "any maskable",
      },
    ],
  };
}
