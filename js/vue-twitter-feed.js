Vue.component("twitter-feed", {
    template: "<a class=\"twitter-timeline\" data-dnt=\"true\" :data-theme=\"theme\" :href=\"profile\">{{heading}}</a>",
    props: ["theme", "profile", "heading"]
});