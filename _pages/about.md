---
permalink: /
title: "About me"
author_profile: true
redirect_from: 
  - /about/
  - /about.html
---

I am now a 4-th year Ph. D candidate in the College of Civil Engineering at Hunan University, supervised by [Prof. Chao Zhang](https://www.researchgate.net/profile/Chao-Zhang-43). I joined Prof. Zhang's [UNSAT lab](https://chaozhanghnu.github.io) in 2020 as a 3-rd year undergraduate student. 

In the UNSAT lab, I belong to a six-member group focusing on stress state and constitutive relation for unsaturated soil. I assisted Prof. Zhang in managing this group and worked closely with the other five members. In addition to my research regarding desiccation cracking in porous media, I deeply participate in the research of the other five members, e.g., clay pore structure evolution via small-angle neutron scattering and small-angle scattering X-ray scattering, development of swimming robot in granular environments, deep-buried soil's anisotropies in fabric, stress and modulus, loading collapse phenomenon in high-expansive clay, etc. 

Research interests
======
<div style="text-align: center;">
  <img src="../images/MudCrack.png" alt="Mud crack pattern" title="Desiccation cracks in clay" width="298" />
  <img src="../images/DCprocess.gif" alt="Cracking process via DIC" title="Desiccation cracking process via DIC" width="420" />
</div>


My recent research passion lies in understanding **the underlying physics of desiccation cracking in porous media** (particularly in soils), which is a ubiquitous phenomenon in both nature and industry. It is a highly non-linear process, involving multi-physics processes such as evaporation, two-phase flow of vapor and water, heat transfer, and build-up of stress due to both the capillary pressure and the adsorption between nano-particles. With such complex processes:

* _How can we accurately predict the initiation of desiccation cracks?_ 

* _What is the key mechanism governing the fascinating self-organized pattern of desiccation cracks?_ 

* _Can we manipulate the propagation of desiccation cracks to create specific patterns on micro and nano scales?_ 

Now, I am trying to integral cutting-edge insights from **optical measurement techniques** (e.g., digital image correlation, micron CT, high-speed photography, etc.), **elastic-plastic fracture mechanics**, **phase transition theory in statistic physics**, and **fractal theory** to explore the physics of crack initiation and propagation, as well as the key underlying mechanism and statistic properties of desiccation crack pattern. 

If you are interested in my research, please get in touch with me via email (yhyang@hnu.edu.cn) or [WeChat](../images/wechat.jpg). 

News
======
**Conference(12/24):** I will attend the _AGU Annual Meeting_ and give an oral presentation or a poster titled "Nucleation-percolation transition in clay desiccation cracking".

**Conference(08/24):** I attended the _IUTAM Symposium Interface Mechanics of Complex Flows and Soft Matter_ and presented a poster.

**Patent(06/24):** Our patent was granted (CN202410502010.9), which is about _a new device_ for measuring the fracture toughness of unsaturated clay.

**Conference(06/24):** I attended the _1st International Yuelu Symposium on “Geotechnical and Underground Engineering”_ and presented a poster titled "Fabric, stress, and modulus anisotropies of sands during high-stress oedometer test". 

**Talk(05/24):** I have given an oral presentation about the "Role of substrate roughness in soil desiccation cracking" at _InterPore Annual Meeting_.

**Paper(03/24):** Our paper titled ["Role of substrate roughness in soil desiccation cracking"](https://doi.org/10.1139/cgj-2023-0638) was published in _Canadian Geotechnical Journal_.



<div class="gallery-container">
  <button onclick="prevImage()" class="gallery-button gallery-button-prev"></button>
  <img id="gallery-image" src="../images/Interpore1.jpg" alt="Photo 1" style="max-width: 60%; height: auto;" />
  <button onclick="nextImage()" class="gallery-button gallery-button-next"></button>
</div>

<style>
  .gallery-container {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 5px;
    position: relative;
  }

  .gallery-button {
    width: 50px;
    height: 50px;
    border: none;
    background-color: rgba(255, 255, 255, 0.3); 
    border-radius: 50%; 
    cursor: pointer;
    transition: background-color 0.3s ease;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .gallery-button:hover {
    background-color: rgba(255, 255, 255, 0.5); 
  }

  .gallery-button-prev {
    background: transparent url('../images/LeftArrow.png') no-repeat center;
    background-size: 20px 20px;
  }

  .gallery-button-next {
    background: transparent url('../images/RightArrow.png') no-repeat center;
    background-size: 20px 20px;
  }
</style>

<script>
  const images = [
    "../images/Interpore1.jpg",
    "../images/Interpore2.jpg",
    "../images/Interpore3.jpg",
    "../images/Interface.png"
  ];

  let currentIndex = 0;

  function showImage(index) {
    const imgElement = document.getElementById('gallery-image');
    imgElement.src = images[index];
    imgElement.alt = `Photo ${index + 1}`;
  }

  function nextImage() {
    currentIndex = (currentIndex + 1) % images.length;
    showImage(currentIndex);
  }

  function prevImage() {
    currentIndex = (currentIndex - 1 + images.length) % images.length;
    showImage(currentIndex);
  }
</script>
