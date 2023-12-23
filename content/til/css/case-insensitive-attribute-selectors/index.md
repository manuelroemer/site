---
date: 2023-12-03T14:52:35+01:00
lastmod: null
title: 'Case-Insensitive Attribute Selectors'
description: null
summary: 'Attribute selectors can be made case-insensitive via the `i` identifier.'
tags: ['css']
---

CSS's attribute selectors are, by-default, case-sensitive. For example, `[attr="value"]` will only match elements where `attr="value"`, not `attr="VALUE"` or any other combination. This can be changed by appending the `i` identifier to the end of the attribute selector, i.e., `[attr="value" i]`.

The opposite, i.e., a case-sensitive identifier `s` is theoretically available, however, as of writing this, it is [only supported by Firefox](https://caniuse.com/mdn-css_selectors_attribute_case_sensitive_modifier).
