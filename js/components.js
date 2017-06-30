Vue.component("twitter-feed", {
    template: "<a class=\"twitter-timeline\" :data-width=\"width\" :data-height=\"height\" data-dnt=\"true\" :data-theme=\"theme\" :href=\"profile\"></a>",
    props: ["theme", "profile", "heading", "width", "height"]
});