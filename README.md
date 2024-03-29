# Manu's Site

This repository contains the files of my [personal website](https://www.manuelroemer.com).
The site is built with [Hugo](https://gohugo.io) using a [custom theme](./layouts).

## Getting Started

To get the repository running locally, you must first install Hugo.
Follow Hugo's [Getting Started guide](https://gohugo.io/getting-started/) for setting up Hugo
locally.

The repository uses [NPM](https://www.npmjs.com/) for managing dependencies and running tasks.
With NPM installed, you can install the repository's dependencies via:

```sh
npm i
```

At this point, everything is set up.
You can start the page on your machine by running:

```sh
npm start
```

Then, open [localhost:1313](localhost:1313) to see the website.

## Understanding the Page's Configuration and Semantics

This site is generated with Hugo. The [Hugo documentation](https://gohugo.io) is a great
location for learning how things work.
Nonetheless, there are certain configurations and semantics which are specific to this site.

The site's [config file](./config.yaml) is documented with comments, each explaining what a
configuration entry is used for (if it deviates from the default or obvious meaning).

In the following, you can also find further descriptions of special configurations and/or
semantics.

### Dates

Hugo provides various date variables which can be configured in a page's frontmatter.
This website is configured to interpret and render dates with the following semantics:

- `date` and `publishDate`:  
  These have the same meaning on this site. They indicate when a page was published for the first time.
- `lastmod`:  
  The date when the page was modified the last time.
  This date must be actively set in a page's frontmatter. It is not automatically generated
  (in contrast to Hugo's default settings).
  Setting this value generates an _"Edited on ..."_ message in the final UI.
  - ✔ **Do** set this date when a page receives a large overhaul or update.
  - ❌ **Do not** set this date when doing small fixes on a page (e.g. typos).

### Tags/Categories

By default, Hugo provides the `tags` and `categories` taxonomies/page params.
This website disables `categories`. Only `tags` are used.

### ToC

The ToC (Table of Contents) is opt-in. Articles that need a ToC need to set `toc: true` in the page variables.

### Description and Summary

Pages can have both a `description` and `summary`.  
`summary` is, by default, generated automatically by Hugo, but can be set to a custom value
if desired in a page's frontmatter. `summary` is used for, e.g., giving the user an overview
of the page's content.  
`description`, on the other hand, is not automatically generated.
It is typically used for a page's `meta` tags (i.e. SEO/providing page metadata).
If `description` is not set, `summary` is used as a fallback.
