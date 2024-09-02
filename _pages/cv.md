---
layout: archive
title: "CV"
permalink: /cv/
author_profile: true
redirect_from:
  - /resume
---

{% include base_path %}

Education and Qualifications
======
* **Ph.D in Geotechnical Engineering, Hunan University**, Sep. 2021 - Present

  Core-curriculum: Numerical Analysis, Dynamics of Structure, Rock and Soil Dynamics, Advanced Soil Mechanics.
  
* **B.S. in Geotechnical Engineering, Hunan University**, Sep. 2017 - Jun. 2021

  Core-curriculum: Advanced Mathematics, Theory of Elasticity, Mechanics of Materials, Fluid Mechanics, Soil mechanics, Structral Mechanics.

  GPA: 3.77/4.00          Ranking: 6/43

Research Interests
======
Desiccation Cracking in Porous Media; Drying Process of Colloidal Material; Fracture Mechanics of Soft Matters; Unsaturated Soils Mechanics. 

Publications
======
  <ul>{% for post in site.publications reversed %}
    {% include archive-single-cv.html %}
  {% endfor %}</ul>

Research Experience
======

Development of algorithm and system for risk and soil type identifications in real-time in autonomous excavators. 
------
Developing an autonomous excavator is cruial for excavation in high-risk construction environments such as the deep ocean and exo-planets, yet it faces two challenges: 1) detecting excavation risk in real time, e.g., detecting unexpected hard rock and existing underground constractions; and 2) detecting soil types during excavation in real time for automatically adjusting excavation strategy. To solve these problems, this work developed a new real-time algorithm based on both time- and frequency- domain analyses of acceleration signals. Moreover, excavation experiment was conducted to determine the appropriate position of acceleration sensors and the hyperparameters of the proposed algorithm. 

<div style="text-align: center;">
  <img src="../images/AutoExcavator1.jpg" alt="AutoExcavator1" title="Risk identification" width="300" />
  <img src="../images/AutoExcavator2.jpg" alt="AutoExcavator2" title="Soil type identification" width="300" />
</div>

Work Experience
======
* Spring 2024: Academic Pages Collaborator
  * Github University
  * Duties includes: Updates and improvements to template
  * Supervisor: The Users

* Fall 2015: Research Assistant
  * Github University
  * Duties included: Merging pull requests
  * Supervisor: Professor Hub

* Summer 2015: Research Assistant
  * Github University
  * Duties included: Tagging issues
  * Supervisor: Professor Git
  
Skills
======
* Skill 1
* Skill 2
  * Sub-skill 2.1
  * Sub-skill 2.2
  * Sub-skill 2.3
* Skill 3
  
Talks
======
  <ul>{% for post in site.talks reversed %}
    {% include archive-single-talk-cv.html  %}
  {% endfor %}</ul>
  
Teaching
======
  <ul>{% for post in site.teaching reversed %}
    {% include archive-single-cv.html %}
  {% endfor %}</ul>
  
Service and leadership
======
* Currently signed in to 43 different slack teams
