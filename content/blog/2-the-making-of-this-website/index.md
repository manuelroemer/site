---
draft: true
date: 2022-12-20T14:43:58+01:00
lastmod: null
title: 'The Making of This Website'
description: null
summary: null
tags: [blog, hugo, pico]
---

There is a saying that the first task on a ToDo list should be "Write a ToDo list".
In that spirit, the first (real) post on a new blog should be about the blog itself.
This post will describe the motivation for and the superficial technical details of this blog
(or rather, the website).

## The Motivation - Why Create a Website?

I've had this domain lying around unused for a year already.
Initially, I only bought it for having a custom E-Mail address.
Back then, I already considered building a website, but it was a plan that kept being pushed back
in favor of other tasks or simply normal life.
Besides, I could never really decide on what purpose I wanted my hypothetical website to _achieve_.
Do I want to build a flashy portfolio? Do I want to create a blog? Do I want to have
a minimal site for showing personal information?
This decision-to-be-made lingered in the back of my ToDo list for about a year until a few weeks
ago, when I read a random comment on [HN](https://news.ycombinator.com) claiming how valueable
having a blog is.
Newly motivated by this comment, I decided to finally tackle this task and created a mental list of
goals and non-goals that I wanted my website-to-be to fulfill:

**Goals:**

- ❗️ It _must_ be as **cheap** as possible (#student-budget).
- ❗️ It _must_ be as simple as possible to **maintain** the page, ideally for a **long time**.
- ❗️ It _must_ be possible to **set** the **initial** website **up** in a relatively **short timeframe**.
- ❕ It _should_ be possible to create "content-pages" (e.g. for a blog) and "normal HTML-based pages"
  (e.g. for the homepage).
- ❔ It would be _nice_ to be able to write **content** in a markup language like **Markdown** or **AsciiDoc**.
- ❔ It would be _nice_ to be able to use **Git** for **content management**.

**Non-Goals:**

- ❌ It _does not_ need a fully-fledged CMS.
- ❌ It _does not_ need interactivity (e.g. comment-boxes) and/or account management.
- ❌ It _does not_ need a flashy, custom design **in the first version**.

## Choosing The Technology

Driven by the above points, I went on a market research regarding which technologies are out there.
One thing became clear very quickly:
There are very many options out there for building your own website/blog.
Too many, in fact.
In a certain way, it felt overwhelming.
From toolbox-like frameworks to plug-and-play solutions, from Astro to Wordpress, there are a lot options
which all have their respective pros and cons which would have to be evaluated.
In the end, I decided to short-circuit the process by choosing an application that was often recommended
in various online forums: Hugo.

### Hugo

[Hugo](https://gohugo.io) is an established solution for a lot of blogs.
It is often advertised as a static site generator with a huge focus on performance.
From my own experience, it is fantastic for unopinionated DIY projects because it pushes you towards
coding things yourself.
This became apparent to me when I followed the "Getting Started" guide, set up a new Hugo
project, ran it and saw... absolutely nothing in the browser.
In contrast to other products, Hugo doesn't even come with a theme installed.
It doesn't do a lot of hand-holding and basically forces you to either find a premade theme or build your own one.

I myself was determined to go with the second route.
Using an off the shelf theme would work, but I wouldn't learn anything about Hugo by using one
(and I wanted to learn how Hugo works!).
In addition, having a custom theme means that, while it is certainly more work, you do have more
control over it.
I will be responsible for maintaining it, but I can granularly control what does and what doesn't show up.
It will be my very own website.

### Pico.css

The problem with building your own website is that a website, typically, needs some kind of design.
And while I do consider myself good at *judging* designs, I did not at all feel motivated to come
up with my own one for this project.
I also knew that I would already have to spend a big amount of my available time on learning Hugo
in order to quickly come up with a good result.
Creating a good looking design in parallel was basically not even an option to consider.
No, I needed a CSS library which does the heavy lifting.

After evaluating a few options, I decided on [Pico.css](https://picocss.com) which describes itself
as a "minimal CSS Framework for semantic HTML".
Indeed, the coolest aspect of Pico is that, as long as you use its intended semantic HTML tags,
you don't need to worry about CSS at all.
There are, apart from a few exceptions, no CSS classes.
Each HTML tag has a default style - and that is it.
While I do believe that this approach will not work out well for "larger" sites, it is a very good
choice for this one for the following reasons:

* It allows to me to have a good-looking design without putting in any effort.
* Not having to apply any CSS classes in the code means that, if I later want to use another
  design, I won't have to do a lot of cleanup. Removing the stylesheet will be enough.
* In order to correctly style the site, I must use semantic HTML (which is always a good thing).

One thing to note is that, while Pico does a lot of heavy lifting, I still had to write
[custom CSS](https://github.com/manuelroemer/site/blob/550b5354aae683f39b84f76a0f7bbe99a8b0f42c/static/css/global.css)
in the end, mainly for aligning elements.
By using atomic CSS and thus by combining the different rules in HTML, I could minimize
the CSS to be written though.

### NPM and Prettier

The above two technologies, Hugo and Pico.css, already allow for the creation of a fully-fledged
website.
And in the spirit of my goals above, I am very hesitant about adding more technologies and dependencies
than absolutely required.
After all, having more dependencies typically implies more maintenance - a non-goal, for this website.
However, there is one thing that I don't want to live without anymore when working with code: Formatters.
In the web space, Prettier has become my go-to formatter of choice and, if possible, I wanted to have
it integrated into the repository.
It turns out that it *is* possible.
The only requirement for it to work with Hugo's templating format is a plugin:
[prettier-plugin-go-template](https://github.com/NiklasPor/prettier-plugin-go-template).

Using prettier (and the plugin) implicitly adds one additional dependency though: NPM.
In my eyes, that actually brings an advantage:
By having NPM set up in your repository, you automatically gain a simple task runner for free via
the `scripts` section in the `package.json` file.
I used that opportunity and placed common commands like starting the dev server or formatting
the repository in my [`package.json` file](https://github.com/manuelroemer/site/blob/550b5354aae683f39b84f76a0f7bbe99a8b0f42c/package.json).

### GitHub Pages

At this point, everything required for building the website was decided.
There was only one point missing: Where and how do I deploy the website once it is done?

This was, by far, the simplest decision:
Since Hugo is a static site generator, any static site hoster would work.
Considering that I was already using GitHub for the repository (and thus also GitHub actions for building it),
using GitHub pages for hosting the artifacts seemed like the obvious choice.
The best part about GitHub pages is that it is entirely free - an appealing price tag, especially when
considering my goal #1.

## Building The Website

Finally, everything was settled. I had a plan. I could get started.
I set the project up (three times in fact - the first two attempts were thrown away because I headed into
directions that I didn't like, e.g. by trying to build on a barebones template).
And, as the [Git commit history shows](https://github.com/manuelroemer/site/commits/main?after=1b0966e4f3b4f3e09ea03449b9b7fb78fe5c3508+69&branch=main&qualified_name=refs%2Fheads%2Fmain),
I was, more or less, following the "learning by doing approach", reading up on and trying to implement
Hugo features one by one.

What amazed me was how quickly you get into Hugo.
I'd fully agree with someone claiming that Hugo's documentation might look intimidating on first glance
due to its sheer size.
But with a focused approach, i.e. giving myself small tasks like "Display Markdown Content", "Render a Page's
Summary" or "Create a Configurable Menu", it became easy enough to digest Hugo's features piece by piece.
Something else that helped me was looking into how other people used Hugo.
Repositories like [hugo-xmin](https://github.com/yihui/hugo-xmin) were very helpful in the beginning
because they were small and yet feature-rich enough to give an overview about the underlying concepts
that Hugo uses.

In the end, I was able to build v1 of this website relatively quickly.
And it does leverage some cool features: Different layouts for different list pages,
configurable menus (including images with light/dark mode support),
a [custom pagination component](https://github.com/manuelroemer/site/blob/1b0966e4f3b4f3e09ea03449b9b7fb78fe5c3508/layouts/partials/pagination.html), etc.
I consider this to be more than enough for a deployable MVP.

## Deploying The Website

With the first deployable version being done, only the very last step remained:
Getting the site running in the wild world of the internet.
I already decided on where to host it: GitHub Pages.
Building a custom pipeline which deploys the changes was the last remaining step to make the site
accessible from other machines.
Creating the GitHub Action was simple enough.
All it took was copying a [template from GitHub](https://github.com/actions/starter-workflows/blob/d487ef2f8b08bf9da60462283a819d34c0c3bf34/pages/hugo.yml)
and doing some small modifications (like using my custom NPM build script).
I also had to change how the Hugo binary is installed (at that point in time, the script in GitHub's template didn't work).
Here, I simply used the [peaceiris/actions-hugo@v2](https://github.com/peaceiris/actions-hugo)
action which was recommended in the Hugo docs.

And that was it - once the pipeline successfully ran, the page was finally accessible!
It was a joyful moment.

The last remaining issue was that the site could only be reached via GitHub Page's default URL, i.e.
`manuelroemer.github.io/site`, in my case.
Naturally, I wanted to use my custom domain here.
To do so, I read through [GitHub's documentation](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site)
multiple times, just to make sure that I didn't mess anything up by chance.
At the end of the day, the required steps were relatively simple though.
I also used the chance to globally [verify the domain](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/verifying-your-custom-domain-for-github-pages)
with GitHub to prevent any accidential takeovers (even though the chance of this happening is probably 0%, but who knows...).

## Outlook and Conclusion
