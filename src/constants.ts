export type GameType = 'fill-blanks' | 'rearrange' | 'double-click' | 'poetic-fill' | 'type-answer' | 'anagrams';

export interface Article {
  id: number;
  title: string;
  description: string;
  image: string;
  gameType: GameType;
  gameExplanation: string;
  reasoning: string;
  content: any; // Specific to game type
}

export const ARTICLES: Article[] = [
  {
    id: 1,
    title: "Human Prosperity in Global Labour Markets",
    description: "Dr. Selina Neri calls for a shift in how we approach work and education, arguing that future labour markets must prioritise human prosperity over mere employment. In a world of rapid technological change, she suggests that we must move beyond routine to prevent burnout and drive lasting engagement.",
    image: "https://images.unsplash.com/photo-1540317580384-e5d43616b9aa?auto=format&fit=crop&q=80&w=800&h=600",
    gameType: 'fill-blanks',
    gameExplanation: "Fill in the missing words in the article to complete the story.",
    reasoning: "The article focuses on the shift from mere 'employment' to 'human prosperity'. The missing words emphasize the UAE's role in technological evolution and the search for meaning in longer lifespans.",
    content: {
      headline: "At Moscow’s January Expert Dialogues, Dr. Selina Neri argued that future labour markets must prioritise human [prosperity] over mere [employment].",
      paragraphs: [
        "MOSCOW: UAE-based academic Dr. Selina Neri has called for a shift in the way global labour markets are approached, urging a focus on human prosperity over mere employment. Speaking at the high-level January Expert Dialogues in Moscow, she addressed global leaders and thinkers under the Open Dialogue framework.",
        "Dr. Neri, Co-founder of the Future Readiness Academy and Visiting Professor at SKOLKOVO Moscow School of Management, delivered a keynote lecture titled Prosperity in the New Conditions of the Labour Market. She argued that people must be allowed not just to work, but to thrive. “People need more than just to be employed; they need to prosper,” she emphasised.",
        "Her remarks were part of an international forum hosted at the National Centre RUSSIA, exploring global megatrends identified by Maksim Oreshkin, Deputy Head of the Russian Presidential Executive Office. Dr. Neri expanded the discussion by focusing on three powerful shifts: [technological] evolution, longer lifespans, and a growing search for [meaning].",
        "She noted that professionals are now expected to contribute beyond the age of [70] and that young people across the globe are questioning identity and purpose. “This is reshaping how we approach work and education,” she said. “We must move beyond routine to prevent burnout and drive lasting engagement.”",
        "Dr. Neri highlighted the UAE’s growing influence in global human capital dialogue, saying, “We are building future readiness in the Global Majority by shifting mindsets and behaviours.”",
        "Organised by the National Centre RUSSIA with the Centre for Cross-Industry Expertise “The Third Rome”, and supported by the Russian Presidential Executive Office, the January Expert Dialogues signal a global shift toward more inclusive and human-centric economic models."
      ],
      answers: ["prosperity", "employment", "technological", "meaning", "70"]
    }
  },
  {
    id: 2,
    title: "The Melania Documentary in London",
    description: "A look at the underwhelming start of the 'Melania' documentary in the UK, where ticket sales have been unexpectedly low. Despite a $40 million deal with Amazon MGM, the film has struggled to attract audiences in London, raising questions about the appetite for political documentaries in the current climate.",
    image: "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&q=80&w=800&h=600",
    gameType: 'rearrange',
    gameExplanation: "The paragraphs are jumbled. Drag them into the correct order.",
    reasoning: "The narrative follows a logical flow: first introducing the London premiere's quiet start (p1), then the production background and budget (p2), followed by the upcoming US premiere and market analysis (p3), and finally concluding with critical reception and future outlook (p4).",
    content: {
      paragraphs: [
        {
          id: 'p1',
          text: "London: The documentary “Melania”, which follows First Lady Melania Trump in the 20 days before Donald Trump’s second inauguration, has struggled to attract audiences in the United Kingdom with what has turned into an unexpectedly quiet start in London. Ahead of its highly anticipated premiere, none of the 28 scheduled screenings at Vue cinemas across the city have drawn audiences. Ticket sales have been extremely low leaving theatre seats largely empty, even as the documentary prepares for its wider global release."
        },
        {
          id: 'p2',
          text: "The film comes with big names behind it and a big budget to match. Produced by Melania’s advisor Marc Beckman and backed by a $40 million deal with Amazon MGM, the documentary was meant to offer close-up access to the First Lady, showcasing both her personal time and her official duties during an intense period in American politics. The idea was to give viewers something fresh and intimate, with moments that rarely make it into the public eye. Instead, the response in London has so far been quiet, leaving industry insiders and viewers surprised."
        },
        {
          id: 'p3',
          text: "The documentary’s US premiere is scheduled for Friday at the Kennedy Center, and both Donald and Melania Trump are expected to attend. While the film’s backers remain optimistic about its performance elsewhere, the UK reaction has raised questions about audience appetite for political documentaries tied to polarising figures. Some commentators say that with so much content available on streaming platforms and online, audiences may be waiting to watch on demand instead of heading to cinema showings."
        },
        {
          id: 'p4',
          text: "Critics and viewers who have commented online are split. Some say the UK market may not have the same pull for a film focused on an American First Lady. Others feel that political fatigue and shifting interests mean that even well-produced documentaries face a tough crowd. Despite the underwhelming start in London, the producers are moving ahead with the global rollout. All eyes will now be on how the film performs in the United States when it opens there later this week. Whether the documentary finds its audience remains to be seen but the empty seats in London are already making headlines."
        }
      ],
      correctOrder: ['p1', 'p2', 'p3', 'p4']
    }
  },
  {
    id: 3,
    title: "NASA Postpones Artemis II Mission",
    description: "An Arctic outbreak in Florida has caused a delay for the first crewed Moon mission in over five decades. NASA officials cited the rare cold weather event as the primary reason for pushing back the launch, prioritising the safety of both personnel and the sophisticated hardware involved in the mission.",
    image: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=800&h=600",
    gameType: 'double-click',
    gameExplanation: "Some words in the last two paragraphs are wrongly placed. Double-click the paragraphs to fix them.",
    reasoning: "The context of the sentences required swapping 'key' and 'mild'. Florida's winters are typically 'mild', not 'key', and the mission is a 'key' step toward establishing a long-term presence, not a 'mild' one.",
    content: {
      paragraphs: [
        "CAPE CANAVERAL: NASA has delayed its first crewed Moon mission in over five decades following a cold weather event in Florida. The Artemis II mission, originally scheduled for early February, has now been pushed back to no earlier than 8 February. Officials cited the “rare Arctic outbreak” as the cause of the postponement.",
        "The Artemis II mission delay is the result of below-freezing temperatures forecast at Kennedy Space Center, where the 98-metre Space Launch System (SLS) rocket was due for a critical fuelling test. The test was initially scheduled for Saturday, but the US space agency decided to call off operations on Thursday evening.",
        "NASA explained that the extreme cold could pose risks to both personnel and equipment. “We’re prioritising safety and protecting hardware,” a spokesperson said, confirming the revised timeline.",
        "Artemis II will carry a four-person crew around the Moon, marking a major milestone in NASA’s renewed lunar ambitions. It will be the first crewed mission of the Artemis programme, following the uncrewed Artemis I flight in 2022.",
        "Artemis II is part of NASA’s broader plan to return humans to the lunar surface and establish a sustainable presence. Unlike Artemis I, this mission will carry astronauts aboard the Orion spacecraft for a lunar flyby before returning to Earth, testing life-support systems and mission readiness ahead of future Moon landings.",
        "This Artemis II mission delay highlights how weather continues to be a critical variable in spaceflight planning. Despite Florida’s typically (key) winters, forecasters reported the incoming chill as one of the coldest spells in recent memory.",
        "The rescheduled launch remains subject to further assessments. Engineers will continue system checks while monitoring weather conditions closely over the next few days. Artemis II is viewed as a (mild) step toward establishing long-term human presence on the Moon and eventually sending astronauts to Mars."
      ],
      wrongWords: ["key", "mild"],
      correctWords: ["mild", "key"]
    }
  },
  {
    id: 4,
    title: "The 2026 Grammy Awards",
    description: "A night of history-making wins and emotional tributes as Bad Bunny claims Album of the Year. The ceremony also featured a powerful farewell from host Trevor Noah, who closed out a successful six-year run, and a moving Lifetime Achievement Award for the legendary Cher.",
    image: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&q=80&w=800&h=600",
    gameType: 'poetic-fill',
    gameExplanation: "A word is missing. Read the poem hint to figure it out and fill in the blank.",
    reasoning: "The poem's imagery of 'hollow lights', 'tears drained as wine', and 'leaning on walls' evokes the unique and recognizable style of Cher. The word 'signature' perfectly describes her iconic, show-stopping fashion sense mentioned in the text.",
    content: {
      paragraphs: [
        "LOS ANGELES: The 2026 Grammy Awards concluded with history-making wins, emotional tributes, and a powerful farewell as host Trevor Noah closed out his final year guiding music’s biggest night.",
        "Puerto Rican superstar Bad Bunny claimed Album of the Year for DeBÍ TiRAR MáS FOToS!, capping a standout night with a heartfelt bilingual acceptance speech. Harry Styles, a three-time Grammy winner himself, announced the award.",
        "Kendrick Lamar and SZA secured Record of the Year for their hit Luther, a powerful moment made even more iconic as Cher, just after receiving her Lifetime Achievement Award, presented the honour. Lamar now holds 27 Grammy wins and has achieved five consecutive Album of the Year nominations, cementing his legacy as one of hip-hop’s greatest.",
        "Song of the Year went to Billie Eilish, continuing her Grammy streak with a moving win for her latest ballad. The ceremony’s performances included a show-stopping collaboration between Clipse and Pharrell Williams, who delivered So Far Ahead against a gospel-inspired stage featuring a dramatic indoor snowstorm.",
        "In a deeply emotional moment, Trevor Noah presented Cher with her award, honouring her extraordinary seven-decade career spanning music, film and pop culture. The 78-year-old star, dressed in her [________] show-stopping fashion, received a standing ovation and delivered a speech equal parts humorous and moving.",
        "The ceremony marked Noah’s final appearance as Grammy host. He closed the night by thanking artists and audiences alike, wrapping up a six-year run that transformed the Grammys with heart, humour, and cultural resonance.",
        "The 2026 Grammys delivered not only awards, but unforgettable moments celebrating artistry, legacy and evolution across generations."
      ],
      poem: [
        "ah, the flirtation began,",
        "when the hollow lights clapped together,",
        "tears drained as wine,",
        "cruising down the neck,",
        "few blessings of ice,",
        "all renounced as the walk stopped,",
        "but the remains are unforgiven,",
        "for the mystery, the path was lost,",
        "cause they always leaned on walls,",
        "while no one became."
      ],
      answer: "signature"
    }
  },
  {
    id: 5,
    title: "Early Heart Check with Calcium Scan",
    description: "RAK Hospital cardiologists recommend a quick 5-minute calcium scan to identify silent heart attack risks before symptoms occur. This non-invasive test detects calcium deposits in the arteries, providing vital insights that can guide early intervention and preventive care for those at risk.",
    image: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&q=80&w=800&h=600",
    gameType: 'type-answer',
    gameExplanation: "Read the article. Some italicized phrases are hints. Type the final word to complete the intervention.",
    reasoning: "The article emphasizes that early detection through calcium scoring allows for 'medical intervention' before a cardiac emergency. The italicized hints point towards the necessity of taking action based on knowledge and timing.",
    content: {
      paragraphs: [
        "RAK Hospital cardiologists recommend Coronary Calcium Scoring, a 5-minute heart scan that identifies silent heart attack risks before symptoms occur.",
        "Ras Al Khaimah, UAE– Heart attacks are no longer confined to a particular age group or lifestyle and increasingly, they *strike without warning*. Many people who suffer a cardiac event have never experienced symptoms beforehand, leaving little time to react. Cardiologists say this is precisely why the conversation around heart health needs to change from reacting to emergencies to preventing them altogether.",
        "Cardiac specialists at RAK Hospital are urging individuals to take a proactive approach through Coronary Calcium Scoring, a quick, non-invasive scan that can help reveal the risk of a coronary event long before it happens.",
        "“When heart disease is silent, waiting for symptoms can be dangerous. Many patients who suffer heart attacks have never experienced chest pain or other warning signs. Coronary Calcium Scoring allows us to uncover hidden risk early, when preventive care can be most effective.” says Dr. Adil Rizvi, Medical Director and Cardiothoracic Surgeon at RAK Hospital. “A test that takes just a few minutes can provide vital insight into a person’s heart health and help guide preventive action.”",
        "Coronary Calcium Scoring works by detecting calcium deposits in the coronary arteries — an early sign of plaque build-up that can restrict blood flow to the heart and increase the likelihood of a heart attack. The scan is *painless, non-invasive, and requires no injections or hospital stay*, yet it offers a clear picture of underlying risk.",
        "The test typically takes 15–30 minutes in total. Most of the time is spent on preparation, including check-in and placing EKG leads, while the actual CT scan is very fast often just about 5 minutes — during which patients lie still and hold their breath for short intervals. What makes this test especially powerful is the opportunity it creates. By understanding their calcium score early, individuals can take timely precautions whether that means lifestyle changes, closer monitoring, or medical intervention well before a cardiac emergency occurs.",
        "Studies show that the presence of coronary calcium, as measured by the score, correlates strongly with long-term cardiovascular risk. People with a *positive CAC score have a significantly higher chance of major cardiac events* compared with those whose score is zero. The scan is particularly recommended for adults over 40 and for those with risk factors such as a family history of heart disease, high cholesterol, diabetes, smoking, obesity, or chronic stress — even if they feel healthy and active.",
        "As heart attacks continue to affect people with no prior warning signs, cardiologists emphasise that prevention today is about *knowledge, timing, and early action*. “Prevention doesn’t always require complex procedures,” added Dr Rizvi. “Sometimes, it starts with a simple scan that helps you understand your risk and act before it’s too late.”",
        "Through greater awareness of non-invasive screening tools like Coronary Calcium Scoring, RAK Hospital continues to reinforce a simple but powerful message: protecting your heart may begin long before symptoms appear."
      ],
      hint: "Italicized words are hints. What is the final word needed?",
      answer: "Intervention"
    }
  },
  {
    id: 6,
    title: "Solar Power in Germany 2025",
    description: "Solar energy has officially overtaken lignite and natural gas in Germany during a record-breaking year. With over 5.5 million photovoltaic systems now in operation, solar power covered 18 percent of the country's electricity use in 2025, marking a significant milestone in the shift toward renewable energy.",
    image: "https://images.unsplash.com/photo-1509391366360-2e959784a276?auto=format&fit=crop&q=80&w=800&h=600",
    gameType: 'anagrams',
    gameExplanation: "Some words are misspelled (anagrams). Type the correct words to fix the article.",
    reasoning: "The anagrams were simple spelling errors in technical and descriptive terms: 'photovoltaic' (the technology), 'progress' (the growth), and 'prioritising' (the strategic shift).",
    content: {
      paragraphs: [
        "Solar power covers 18 percent of Germany’s 2025 electricity use, overtaking lignite and natural gas with record output from 5.5 million [photovoltaci] systems.",
        "BERLIN: Solar energy made major [prgoress] in Germany during 2025, with solar power covering 18 percent of Germany’s 2025 electricity use, according to new data released by the German Solar Industry Association (BSW). This marks a notable rise from 14 percent in 2024, setting a new national record.",
        "The significant jump means that solar power covers 18 percent of Germany’s 2025 electricity use, surpassing lignite and natural gas for the first time. Lignite’s contribution stood at about 14 percent, while natural gas made up approximately 16 percent of the country’s power generation. Wind energy, however, continued to lead with 27 percent, maintaining its position as Germany’s largest power source.",
        "Figures from the Fraunhofer Institute for Solar Energy Systems show that more than 5.5 million photovoltaic systems were in operation last year, collectively generating an estimated 87 terawatt hours of electricity. This figure represents a 15 terawatt hour increase from 2024, highlighting the country’s consistent investment in clean energy.",
        "The shift shows Germany’s commitment to phasing out fossil fuels and [priotrisniag] renewables in its energy mix. As solar infrastructure continues to expand, analysts expect this share to grow even further over the coming years.",
        "Experts suggest that as long as support policies remain in place and grid infrastructure evolves, the momentum behind solar will continue to shape Germany’s energy future."
      ],
      anagrams: ["photovoltaci", "prgoress", "priotrisniag"],
      answers: ["photovoltaic", "progress", "prioritising"]
    }
  }
];
