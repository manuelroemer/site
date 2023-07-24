---
draft: true
date: 2023-07-24T12:06:47+02:00
lastmod: null
title: "Project Summary - The \"CSRD Reporting\" Application"
summary: 'As part of a university course, we developed the "CSRD Reporting" application in SAPUI5. This article summarizes the project and highlights interesting aspects of the solution.'
tags: ['university', 'ui5', 'js', 'ts', 'abap']
---

On January 5th, 2023, the European Union passed the _Corporate Sustainability Reporting Directive_, in short, the _CSRD_. Beginning at the end of 2024 and gradually ramping up until 2028, listed companies exceeding certain sizes are required to report on company-specific sustainability matters within various categories, including, among others, climate change, biodiversity or social topics. The associated effort is not to be underestimated: it was suggested that complying with the CSRD may require certain companies to hire up to 2 full-time employees - a significant investment, both time- and money-wise.

As part of the practical course _"Enterprise Software Engineering on the Example of SAP"_ at the [TUM](https://www.tum.de/), [Nhu](https://github.com/MinhNhuD), [Tim](https://github.com/LuckyG0ldfish) and [I](https://github.com/manuelroemer) were tasked by our project partners from Capgemini to develop a proof of concept for a web application that assists companies with determining their company specific reporting requirements according to the CSRD. The practical course, as the name suggests, was set under the SAP umbrella, resulting in the requirement to build the application with two technologies that are, perhaps, not very well known by "normal" developers: [ABAP](https://en.wikipedia.org/wiki/ABAP), a proprietary programming language used for backend development[^1], and [SAPUI5](https://sapui5.hana.ondemand.com/), a frontend framework.

[^1]: In our case. ABAP is not exclusively used for backend development only.
