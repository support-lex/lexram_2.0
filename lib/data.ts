import {
  Scale,
  Landmark,
  Users,
  Home,
  Briefcase,
  Factory,
  Calculator,
  Handshake,
  TreePine,
  Building2,
  Building,
  ShoppingCart,
  Car,
  Map,
  Vote
} from 'lucide-react';

export const practiceAreas = [
  {
    id: 'criminal',
    icon: Scale,
    title: 'Criminal Law',
    desc: 'Every criminal litigation document — bail, anticipatory bail, quash petition, return of property, default bail, revision, transfer — drafted around your specific facts, sections, and court. Research on any point of criminal procedure, evidence, sentencing, or substantive offence under the IPC / BNS, CrPC / BNSS, NDPS Act, POCSO, Prevention of Corruption Act, UAPA, and every other criminal statute.',
    research: [
      'The test for bail in non-bailable economic offences',
      'When Section 482 CrPC / 528 BNSS inherent jurisdiction can quash proceedings',
      'The law on dying declaration as sole basis for conviction',
      'Default bail rights when chargesheet is delayed',
      'Sentencing principles for first offenders in IPC offences'
    ],
    drafting: [
      'Bail Application (Regular — Sessions & High Court)',
      'Anticipatory Bail Application (with interim protection)',
      'Quash Petition (Section 482 / Article 226)',
      'Application for Return of Seized Property',
      'Default Bail Application (indefeasible right under Section 167(2))',
      'Bail Modification Application',
      'Cancellation of Bail Application',
      'Written Submissions in Bail / AB Hearings',
      'Reply to State\'s Objections in Bail Matters',
      'Revision Petition against Magistrate / Sessions Court orders',
      'Transfer Petition',
      'Application for Police Custody Remand',
      'Protest Petition against Closure Report'
    ]
  },
  {
    id: 'constitutional',
    icon: Landmark,
    title: 'Constitutional Law & Writ Jurisdiction',
    desc: 'The full depth of constitutional jurisprudence — fundamental rights, directive principles, judicial review, legislative competence, and the complete body of writ jurisdiction law. Research on any constitutional question — Article 14 equality, Article 19 freedoms, Article 21 personal liberty, Articles 32 and 226 writ remedies, federalism, emergency provisions, and the entire history of constitutional interpretation from the Constituent Assembly to today\'s bench.',
    research: [
      'Whether a policy violates Article 14 arbitrariness doctrine post-EP Royappa',
      'The scope of Article 21 in the context of livelihood, shelter, health, and dignity',
      'When a High Court should exercise its Article 226 jurisdiction versus leaving the remedy to a statutory tribunal',
      'The complete law on PIL — standing, maintainability, and scope',
      'The test for legislative competence in inter-list disputes between the Union and States'
    ],
    drafting: [
      'Writ Petition under Article 226 (High Court)',
      'Writ Petition under Article 32 (Supreme Court)',
      'PIL Petition with public interest framing',
      'Written Submissions in constitutional matters',
      'Counter Affidavit to writ petitions',
      'Reply Affidavit',
      'Application for Interim Stay / Status Quo in writ proceedings',
      'Contempt Petition (civil and criminal contempt)',
      'Application for directions in ongoing PILs'
    ]
  },
  {
    id: 'family',
    icon: Users,
    title: 'Family Law — Matrimonial, Succession & Guardianship',
    desc: 'The complete body of family law across all personal law systems — Hindu, Muslim, Christian, Parsi — and secular statutory law. Matrimonial disputes, divorce, maintenance, custody, adoption, succession, and guardianship — researched and drafted with precision across the full spectrum of family court litigation.',
    research: [
      'The test for irretrievable breakdown of marriage as a ground for divorce',
      'How courts determine maintenance quantum under Section 125 CrPC / Section 144 BNSS for different income levels',
      'The law on child custody — the welfare principle versus parental rights',
      'Succession rights of daughters in Hindu joint family property post-2005 amendment',
      'Muslim women\'s maintenance rights post the triple talaq judgment and the Muslim Women (Protection of Rights on Marriage) Act'
    ],
    drafting: [
      'Petition for Divorce (Mutual Consent — HMA Section 13B)',
      'Petition for Divorce (Contested — cruelty, desertion, adultery)',
      'Application for Maintenance (Section 125 CrPC / 144 BNSS)',
      'Application for Interim Maintenance',
      'Petition for Child Custody and Guardianship',
      'Petition for Adoption (CARA guidelines, Hindu Adoption Act)',
      'Application for Visitation Rights',
      'Succession Certificate Application',
      'Letters of Administration Application',
      'Written Submissions in matrimonial appeals',
      'Counter in custody proceedings',
      'Domestic Violence Application (under Protection of Women from DV Act)',
      'Stridhan Recovery Application'
    ]
  },
  {
    id: 'property',
    icon: Home,
    title: 'Property, Land & Revenue Law',
    desc: 'The largest body of civil litigation in India — property disputes, land acquisition, tenancy, adverse possession, easements, partition, specific performance, and revenue proceedings — fully supported with research and drafting tools built for land lawyers and property litigators at every level.',
    research: [
      'The essential requirements of adverse possession and how courts have applied the 12-year period',
      'The law on specific performance — when courts grant it and when they refuse it in discretion',
      'Compensation calculation under the Right to Fair Compensation and Transparency in Land Acquisition Act 2013',
      'The law on pre-emption rights under various State tenancy Acts',
      'How courts treat oral partition and its proof requirements'
    ],
    drafting: [
      'Plaint for Specific Performance of Agreement to Sell',
      'Plaint for Declaration of Title and Injunction',
      'Written Statement in property disputes',
      'Partition Suit Plaint',
      'Application for Temporary Injunction (Order 39 CPC)',
      'Objections to Injunction Application',
      'Application for Land Acquisition Compensation Enhancement',
      'Petition challenging land acquisition under Article 226',
      'Application under Section 144 / Section 151 CPC',
      'Appeal against revenue court orders',
      'Easement Suit Plaint',
      'Plaint for Recovery of Possession'
    ]
  },
  {
    id: 'service',
    icon: Briefcase,
    title: 'Service Law & Employment',
    desc: 'The full spectrum of service law — government servants, public sector employees, quasi-government employees, and private sector workers — covering disciplinary proceedings, termination, suspension, promotion disputes, seniority, pension, and all service-related reliefs before the CAT, High Courts, and the Supreme Court.',
    research: [
      'The scope of judicial review of disciplinary proceedings — when courts interfere with findings of Inquiry Officers',
      'The law on deemed promotion and seniority in the absence of timely DPCs',
      'Whether an employee dismissed on criminal conviction can be reinstated on acquittal',
      'The current position on regularization of contractual and daily wage employees after Uma Devi',
      'Pension rights — when courts have protected pension despite resignation or compulsory retirement'
    ],
    drafting: [
      'Original Application before CAT (Central Administrative Tribunal)',
      'Writ Petition against service orders (High Court)',
      'Representation / Appeal against Charge Sheet',
      'Written Submissions in disciplinary inquiry',
      'Application challenging suspension order',
      'Petition for reinstatement with back wages',
      'Petition for promotion / seniority dispute',
      'Pension dispute application',
      'Contempt petition for non-implementation of service orders',
      'Counter Affidavit in service writ petitions'
    ]
  },
  {
    id: 'labour',
    icon: Factory,
    title: 'Labour & Industrial Law',
    desc: 'The complete body of labour jurisprudence — Industrial Disputes Act, Factories Act, ESI Act, PF Act, Contract Labour Act, Maternity Benefit Act, and the new Labour Codes. Research and drafting for both worker-side and management-side practitioners appearing before Labour Courts, Industrial Tribunals, and High Courts.',
    research: [
      'The law on unfair labour practice — what constitutes victimization of a trade union member',
      'The distinction between retrenchment, closure, and lay-off and the procedural requirements for each',
      'Whether contract workers are entitled to regularization against the contractor or the principal employer',
      'The law on gratuity forfeiture — when it is permissible and when courts have set it aside',
      'Standing of a trade union to raise an industrial dispute on behalf of individual workmen'
    ],
    drafting: [
      'Statement of Claim before Labour Court / Industrial Tribunal',
      'Management\'s Written Statement in industrial disputes',
      'Application for stay of Award',
      'Writ Petition against Labour Court / Tribunal order',
      'Complaint under Unfair Labour Practice provisions',
      'Application for recovery of wages / dues',
      'ESI / PF dispute application',
      'Conciliation proceeding submissions',
      'Demand Notice (precursor to strike)',
      'Written Submissions in appellate proceedings'
    ]
  },
  {
    id: 'tax',
    icon: Calculator,
    title: 'Tax Law — Direct & Indirect',
    desc: 'Income Tax, GST, Customs, Central Excise, Service Tax — research and drafting for tax litigation across every forum: ITAT, CESTAT, GST Appellate Authority, High Courts, and the Supreme Court. Research on assessment, penalties, search and seizure, transfer pricing, international taxation, and the interpretation of every major tax statute.',
    research: [
      'The law on reassessment under the amended provisions of the Income Tax Act — when the jurisdictional conditions are satisfied and when they are not',
      'The test for "supply" under GST — where courts have drawn the line between taxable and exempt transactions',
      'The law on best judgment assessment — the procedural requirements and when courts set them aside',
      'Customs valuation disputes — the methodology and burden of proof',
      'The complete law on penalty under Section 271(1)(c) — concealment versus furnishing inaccurate particulars'
    ],
    drafting: [
      'Appeal before Income Tax Appellate Tribunal (ITAT)',
      'Appeal before CESTAT',
      'Appeal before GST Appellate Authority',
      'Writ Petition against tax assessment / notice',
      'Application for Stay of Demand',
      'Reply to Show Cause Notice (Income Tax / GST / Customs)',
      'Written Submissions before Tribunal',
      'Cross-objections in tax appeals',
      'Application for Rectification of Mistake',
      'Petition challenging search and seizure operations'
    ]
  },
  {
    id: 'arbitration',
    icon: Handshake,
    title: 'Arbitration & Alternative Dispute Resolution',
    desc: 'The complete Arbitration and Conciliation Act 1996 — domestic and international arbitration, Section 9 interim measures, Section 11 appointment of arbitrators, Section 34 challenge to awards, and Section 37 appeals — researched and drafted for both arbitration practitioners and corporate litigators challenging or enforcing awards in court.',
    research: [
      'The current test for interference with arbitral awards under Section 34 — what constitutes "patent illegality" after Vijay Karia and Ssangyong',
      'When a court can grant interim relief under Section 9 before or during arbitration',
      'The law on appointment of arbitrators — when courts step in and what constitutes a unilateral appointment that is invalid',
      'Arbitrability of disputes — which categories of disputes cannot be referred to arbitration under Indian law',
      'The enforcement of foreign awards under Part II and the public policy ground for refusal'
    ],
    drafting: [
      'Application under Section 9 (Interim Measures — pre or during arbitration)',
      'Application under Section 11 (Appointment of Arbitrator)',
      'Petition under Section 34 (Challenge to Award)',
      'Appeal under Section 37',
      'Application for Enforcement of Domestic Award',
      'Application for Enforcement of Foreign Award',
      'Statement of Claim before Arbitral Tribunal',
      'Reply / Counter Claim in arbitration',
      'Application for extension of arbitral mandate',
      'Written Submissions in arbitral proceedings'
    ]
  },
  {
    id: 'environmental',
    icon: TreePine,
    title: 'Environmental Law & NGT',
    desc: 'The complete body of environmental jurisprudence — National Green Tribunal proceedings, coastal regulation zone disputes, forest clearances, pollution control orders, environmental impact assessments, and the constitutional right to a clean environment under Article 21. Research and drafting for practitioners before the NGT and High Courts in environmental matters.',
    research: [
      'The precautionary principle — how courts have applied it in industrial and infrastructure cases',
      'The polluter pays principle and how compensation is calculated in environmental damage cases',
      'The law on forest land diversion — when courts have permitted it and when they have not',
      'NGT jurisdiction — what matters the NGT can entertain and what goes to the High Court',
      'Coastal Regulation Zone notifications — how courts have interpreted the prohibited zone rules'
    ],
    drafting: [
      'Application before the National Green Tribunal',
      'Reply / Counter Affidavit in NGT proceedings',
      'Writ Petition in environmental matters (High Court / Supreme Court)',
      'PIL on environmental grounds',
      'Written Submissions before NGT',
      'Application for Compensation under NGT jurisdiction',
      'Response to Environmental Impact Assessment challenges',
      'Application for Stay of industrial operations'
    ]
  },
  {
    id: 'banking',
    icon: Building2,
    title: 'Banking, Finance & Insolvency',
    desc: 'The Insolvency and Bankruptcy Code 2016, SARFAESI Act, DRT proceedings, recovery of bank dues, debt restructuring, and the complete body of banking law — researched and drafted for practitioners on both sides: financial creditors, operational creditors, corporate debtors, and guarantors before NCLTs, DRTs, and High Courts.',
    research: [
      'The law on operational creditor claims versus financial creditor claims — priority, process, and remedies',
      'When a personal guarantor can be proceeded against separately under the IBC',
      'The SARFAESI Act — when borrowers can challenge action under Section 17 and the grounds available',
      'The law on moratorium under Section 14 IBC — what it covers and what it does not',
      'The Committee of Creditors — voting thresholds and judicial review of CoC decisions'
    ],
    drafting: [
      'Application before NCLT (Financial Creditor — Section 7)',
      'Application before NCLT (Operational Creditor — Section 9)',
      'Reply by Corporate Debtor',
      'Application before DRT for recovery',
      'Application challenging SARFAESI action (Section 17 DRT)',
      'Writ Petition challenging DRT / NCLT orders',
      'Application for Stay of NCLT / DRT proceedings',
      'Claim before Resolution Professional',
      'Objection to Resolution Plan',
      'Written Submissions in IBC proceedings'
    ]
  },
  {
    id: 'company',
    icon: Building,
    title: 'Company Law & Corporate Litigation',
    desc: 'The Companies Act 2013, SEBI regulations, minority shareholder oppression and mismanagement proceedings, company winding up, corporate restructuring, and regulatory enforcement — researched and drafted for company lawyers practicing before the NCLT, NCLAT, High Courts, and SAT.',
    research: [
      'The law on oppression and mismanagement — what conduct crosses the threshold for NCLT intervention',
      'Minority shareholder protection — what remedies are available and how courts have quantified buyouts',
      'The test for fraudulent trading and when directors face personal liability',
      'SEBI enforcement proceedings — the standard of proof and scope of SAT review',
      'The law on corporate restructuring — when the NCLT approves a scheme and when it refuses'
    ],
    drafting: [
      'Petition for Oppression and Mismanagement (NCLT)',
      'Application for Winding Up',
      'Appeal before NCLAT',
      'Reply to SEBI Show Cause Notice',
      'Appeal before Securities Appellate Tribunal (SAT)',
      'Written Submissions in company matters',
      'Application for removal / appointment of director',
      'Petition challenging corporate restructuring scheme',
      'Application for inspection of company records'
    ]
  },
  {
    id: 'consumer',
    icon: ShoppingCart,
    title: 'Consumer Law & Deficiency in Service',
    desc: 'The Consumer Protection Act 2019 — complaints before District, State, and National Consumer Commissions for deficiency in service, unfair trade practices, product liability, and medical negligence. Research on quantum of compensation, the definition of consumer, and the full body of consumer jurisprudence from the National Commission and Supreme Court.',
    research: [
      'What constitutes "deficiency in service" under the Consumer Protection Act — the current legal test',
      'Medical negligence in consumer forums — the standard of care and how courts determine it',
      'The law on builder-buyer disputes — what delays, defects, and deviations constitute actionable deficiency',
      'The jurisdiction of consumer forums — pecuniary limits, territorial jurisdiction, and what disputes can be filed',
      'Unfair trade practices — what representations and omissions courts have held to cross the line'
    ],
    drafting: [
      'Consumer Complaint (District / State / National Commission)',
      'Reply to Consumer Complaint',
      'Written Arguments before Consumer Commission',
      'Appeal against District Commission order',
      'Revision Petition before National Commission',
      'Application for Interim Relief / Stay',
      'Application for Execution of Consumer Commission Award'
    ]
  },
  {
    id: 'mact',
    icon: Car,
    title: 'Motor Accident Claims (MACT)',
    desc: 'The full body of Motor Accident Claims Tribunal jurisprudence — compensation calculation, structured formula, non-pecuniary damages, liability determination, hit-and-run claims, and insurance dispute — for claimant advocates and insurance company lawyers alike.',
    research: [
      'The current multiplier table post-National Insurance Company v. Pranay Sethi — how compensation is calculated for different age groups and income levels',
      'The law on non-pecuniary heads — loss of consortium, pain and suffering, loss of amenities — and how courts have quantified them',
      'When the insurer can avoid liability — what policy violations are sufficient to avoid payment',
      'The law on hit-and-run claims and the Solatium Scheme',
      'The treatment of income for unorganized sector workers and self-employed claimants'
    ],
    drafting: [
      'Claim Petition before MACT',
      'Written Statement by Insurance Company',
      'Written Submissions on Compensation Quantum',
      'Appeal against MACT Award',
      'Application for Enhancement / Reduction of Award',
      'Written Arguments on liability issues'
    ]
  },
  {
    id: 'revenue',
    icon: Map,
    title: 'Revenue, Tenancy & Land Reforms Law',
    desc: 'State-specific revenue law, tenancy rights, land ceiling legislation, inam abolition, and agricultural land reforms — with research across the major State land reform enactments and the Supreme Court\'s jurisprudence on agricultural tenancy, occupancy rights, and land ceiling surplus.',
    research: [
      'The law on tenancy — when a tenant acquires occupancy rights and when the landlord can resume possession',
      'Land ceiling surplus — how courts have treated benami holdings and transfers to defeat ceiling laws',
      'The law on inam abolition — what rights former inamdars retained and what vested in the State',
      'Revenue records versus title — the evidential value of revenue entries in property disputes',
      'The law on grant of lands to SCs/STs — conditions, restrictions on alienation, and consequences of violation'
    ],
    drafting: [
      'Revision against Revenue Tribunal / Board of Revenue orders',
      'Writ Petition in revenue matters',
      'Written Submissions before Revenue Courts',
      'Application for correction of revenue records',
      'Land ceiling surplus determination proceedings',
      'Tenancy dispute pleadings'
    ]
  },
  {
    id: 'elections',
    icon: Vote,
    title: 'Elections & Representation of the People',
    desc: 'Election petitions, corrupt practices, disqualification proceedings, anti-defection law, and the law on election offences — researched and drafted for election law practitioners at every level.',
    research: [
      'The grounds for an election petition — what constitutes a corrupt practice under the Representation of the People Act',
      'Anti-defection — when does a vote against party whip trigger disqualification and who decides',
      'The law on disqualification of elected representatives under Article 102 / Article 191',
      'What constitutes a "bribery" ground for election petition and the standard of proof',
      'The Speaker\'s power in anti-defection proceedings and whether it is judicially reviewable'
    ],
    drafting: [
      'Election Petition',
      'Written Statement in election petition',
      'Application for disqualification under the Tenth Schedule',
      'Writ Petition challenging disqualification decision',
      'Written Submissions in election matters',
      'Application for stay of disqualification'
    ]
  }
];

export const stories = [
  {
    title: "The Land Lawyer in Lucknow",
    name: "Deepak",
    desc: "Deepak has a specific performance suit coming up for a first hearing. The agreement to sell is 8 years old. The seller is claiming the buyer delayed — the buyer says the seller created conditions. Deepak needs to know the law on readiness and willingness cold before he even files the plaint.",
    action: "He asks LexRam: \"What is the law on readiness and willingness in specific performance — who bears the burden and how do courts assess it?\" In under a minute, he has the full principle from Saradamani Kandappan, the distinction between pleading readiness and proving it, and the Supreme Court's current position on what evidence courts expect.",
    result: "He then drafts the Plaint for Specific Performance. He fills in the agreement details, the consideration paid, the defaults by the seller, and the plaintiff's conduct. LexRam produces a complete, argued plaint — incorporating the readiness and willingness averments, the legal propositions, and the prayer. He files the same day."
  },
  {
    title: "The Service Lawyer in Chennai",
    name: "Meera",
    desc: "Meera represents a government school teacher suspended for two years during a departmental inquiry that has produced no result. The client is on subsistence allowance — the family is struggling. She needs to challenge both the prolonged suspension and the delay in inquiry.",
    action: "She uses Deep Research: \"What is the law on prolonged suspension — when do courts compel reinstatement pending inquiry, and what is the current position on maximum permissible suspension period?\" LexRam gives her the complete picture — the Supreme Court's guidelines in Ajay Kumar Choudhary, the CAT and High Court positions, and the specific orders courts have passed when inquiry delay is attributable to the department.",
    result: "She drafts the Writ Petition. It goes in the next morning with a fully argued challenge — the constitutional dimension of Article 21, the Supreme Court authorities on suspension as a punishment in disguise, and a prayer for reinstatement with full pay for the suspension period."
  },
  {
    title: "The Family Lawyer in Delhi",
    name: "Ananya",
    desc: "Ananya has a complex custody matter — a mother from a foreign country, a father who is an Indian citizen, a child who has been in India for three years. The father wants a permanent custody order. The mother is claiming habitual residence in her home country and wants the child returned.",
    action: "She researches: \"What is the law on international child custody disputes in India — how do Indian courts determine which country's courts have jurisdiction, and what weight is given to foreign custody orders?\" LexRam gives her the complete framework — the Supreme Court's position on comity of courts, the welfare principle overriding foreign decrees, and the specific factors courts have applied in international relocation disputes.",
    result: "She drafts the written submissions for the custody hearing with full citations. She walks in prepared for every jurisdictional and substantive argument the other side might raise."
  },
  {
    title: "The Tax Lawyer in Mumbai",
    name: "Rohit",
    desc: "Rohit has received a GST Show Cause Notice alleging that his client — a logistics company — has been charging GST at 5% for transportation services when the department says 18% applies. The SCN is for ₹4.2 crores over three years.",
    action: "He asks LexRam: \"What is the correct classification of logistics and freight forwarding services under GST — and where courts have ruled on the applicable rate dispute?\" He gets the full analysis — the relevant HSN entries, the CBIC circulars, the AAR and AAAR rulings, and the High Court judgments on classification disputes.",
    result: "He then drafts the Reply to Show Cause Notice — factual matrix, legal position, classification argument, the alternative submission on penalty, and a prayer to drop proceedings. He files it within the 30-day window with complete confidence."
  }
];

export const testimonials = [
  {
    quote: "I practice land and revenue law exclusively. LexRam's understanding of the adverse possession jurisprudence and the specific performance case law is extraordinary. It saved me three days of research on a complicated acquisition matter.",
    author: "Property Litigation Advocate, Allahabad High Court"
  },
  {
    quote: "The service law research depth is exceptional. Every CAT and High Court judgment I needed on prolonged suspension and departmental inquiry delay — surfaced in minutes, explained clearly, ready to cite.",
    author: "Service Law Practitioner, Central Administrative Tribunal, Delhi"
  },
  {
    quote: "I used the arbitration drafting feature for a Section 34 challenge. The draft captured every ground — patent illegality, breach of natural justice, public policy — with the right authorities. I edited for 30 minutes and filed.",
    author: "Commercial Litigation Advocate, Bombay High Court"
  },
  {
    quote: "GST litigation requires knowing not just the statute but how the AAR rulings, CBIC circulars, and High Court decisions interact. LexRam gave me that synthesis instantly.",
    author: "Tax Litigator, CESTAT & GST Appellate, Ahmedabad"
  },
  {
    quote: "As a family court advocate in a smaller town, I don't have a research team. LexRam changed that completely. Every maintenance, custody, and divorce matter I handle is now properly researched and properly drafted.",
    author: "Family Court Advocate, Rajasthan"
  }
];

export const faqs = [
  {
    q: "Does LexRam cover all areas of law or only criminal?",
    a: "LexRam covers the full breadth of Indian law — criminal, constitutional, family, property, service, labour, tax, arbitration, environmental, banking, insolvency, company, consumer, election, and more. If it has been litigated in an Indian court, LexRam knows the law."
  },
  {
    q: "Is LexRam updated with the BNS, BNSS, and BSA — the new criminal codes?",
    a: "Yes. LexRam covers the Bharatiya Nyaya Sanhita, Bharatiya Nagarik Suraksha Sanhita, and Bharatiya Sakshya Adhiniyam in full — alongside their IPC, CrPC, and Evidence Act equivalents — so you can research and draft under either regime."
  },
  {
    q: "Can I use LexRam for State-specific law — like State tenancy Acts or State service rules?",
    a: "LexRam's knowledge covers the Supreme Court's interpretation of State legislation across all major States. For State-specific revenue, tenancy, and service law questions, LexRam surfaces the relevant precedents and principles from the Supreme Court's authoritative rulings on those statutes."
  },
  {
    q: "How are the citations in drafted documents verified?",
    a: "Every precedent cited in a LexRam draft is drawn from the live database of real judgments. Citations are in proper SCC, AIR, and Neutral Citation format. You should always verify before filing — as you would with any research — but LexRam does not invent cases."
  },
  {
    q: "Can junior advocates and clerks use the same account?",
    a: "Yes — the Chamber plan supports multiple users. Many senior advocates use LexRam as a research and drafting tool for their juniors, reviewing and finalizing the output before filing."
  },
  {
    q: "Is there a free trial?",
    a: "Yes — 14 days, all features unlocked, no credit card required."
  }
];
