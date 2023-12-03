---
date: 2023-12-03T14:27:14+01:00
lastmod: null
title: "Partial Attribute Selectors"
description: null
summary: "Describes CSS's partial attribute selectors (`~=`, `*=`, `^=`, `$=`, and `|=`)."
tags: ["css"]
---

CSS's attribute selectors allow partial matching of attribute values via the following selector syntax:

| Syntax | Matches | Example |
| ------ | ------- | ------- |
| `[attr~="value"]` | Any element whose attribute `attr` contains the value `value` in a _space-separated_ list of words. | `<element attr="any value here" />` |
| `[attr*="value"]` | Any element whose attribute `attr` contains the `value` substring. | `<element attr="anyvaluehere" />` |
| `[attr^="value"]` | Any element whose attribute `attr` starts with the `value` substring. | `<element attr="valuehere" />` |
| `[attr$="value"]` | Any element whose attribute `attr` ends with the `value` substring. | `<element attr="anyvalue" />` |
| `[attr\|="value"]` | Any element whose attribute `attr` is _either_ `value` _or_ starts with the `value` substring and is followed by a dash. | `<element attr="value" />` and `<element attr="value-here" />` |

As usual, these selectors are _case-sensitive_.
