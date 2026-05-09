You are helping with a focused literature sweep for an AI/ML research project on the card game Gwent.

Project context:
We are building AI for a Gwent-style collectible card game. The engine is deterministic, has a clean legal-move contract, supports headless AI-vs-AI simulation with deterministic seeds, has a hidden-information-safe per-row legal-action export, and currently runs a deliberately weak deterministic policy (`legal-heuristic-v0`) over engine legal moves. The game is sequential, two-player, zero-sum, imperfect-information (hidden hand and deck order), with variable legal action sets each turn (between mulligan, card play, leader use, prompt response, and pass), small decks (around 22-30 battlefield cards plus a leader), three rounds, and round-passing as a strategic resource. The engine produces a per-seat safe observation, ordered legal action lists, and sparse terminal rewards already.

Goal:
Find reputable, technically relevant papers or surveys that could ground a Gwent AI research program. Prioritize primary sources that could plausibly affect concrete near-term decisions: legal heuristic v1 design, search/self-play planner choice, ML observation/action/reward design, evaluation ladder (Elo/Glicko, matchup matrices, fixed seed suites, exploitability proxies), difficulty scaling for human-like opponents, and deck-conditioned versus faction-specialist agent scope. Do not inflate relevance, do not assume that self-play will converge for imperfect-information games without source support, and do not assume an algorithm transfers from perfect-information games (chess/Go-style) without explicit imperfect-information evaluation.

Search scope:
Focus on imperfect-information games, sequential decision-making under partial observability, and game AI. Prefer peer-reviewed conference and journal papers (NeurIPS, ICML, IJCAI, AAAI, IEEE CIG/COG, AIIDE, ICLR, JAIR, Science, Nature), reputable theses, and well-cited arXiv papers from established labs. Avoid blog posts, generic RL tutorials, and low-quality venues unless they explicitly point to primary sources.

Core topics to search:

1. Imperfect-information game AI foundations: counterfactual regret minimization (CFR), Deep CFR, Neural Fictitious Self-Play (NFSP), Policy-Space Response Oracles (PSRO), exploitability, ε-Nash equilibria for two-player zero-sum imperfect-information games.
2. Collectible / trading card game AI: Hearthstone, Magic: The Gathering, Legends of Code and Magic, KeyForge, or other CCG/TCG environments — primary sources only, plus recognized environments and competitions.
3. Gwent-like sequential games: small-deck imperfect-information card games, two-player turn-based games with hidden hands and deck order, three-round / multi-round structures, and pass-as-strategic-resource games.
4. Legal action masking and variable action sets: action masking in deep RL, pointer / set / graph-structured action spaces, action embeddings for variable-size legal sets, masked policy networks.
5. Self-play reinforcement learning: AlphaGo / AlphaZero / MuZero family for perfect information, with explicit notes on imperfect-information adaptation; Stratego (DeepNash / R-NaD), Diplomacy (Cicero, no-press Diplomacy), poker (Pluribus, Libratus, ReBeL, DeepStack) — primary sources only.
6. MCTS and ISMCTS for card games: Information Set Monte Carlo Tree Search, perfect-information Monte Carlo (PIMC) and its known biases, determinization-based search, particle filtering for hidden state, double-oracle MCTS variants.
7. CFR family applied to imperfect-information card games specifically: CFR+, MCCFR, Deep CFR, ReBeL-style search, regret-based methods on small or medium-size imperfect-information games.
8. Policy / value learning for hidden-information games: value-of-information, belief-state value functions, recurrent / transformer / attention encoders for partial observability, mixed-strategy outputs.
9. Evaluation methodology for game AI: Elo, Glicko, TrueSkill, exploitability and approximate exploitability, matchup matrices, fixed seed suites, tournament harnesses, regression baselines, anti-overfitting protocols, evaluation against humans.
10. Difficulty scaling and human-like bounded play: bounded rationality, controllable difficulty, intentional blunders, opponent-style imitation, behavioral cloning from human play, strength control without "drunk" pathological behavior.
11. Opponent modeling / belief modeling: explicit hand inference, opponent policy modeling, particle filters over opponent hands, Bayesian opponent modeling.
12. Deck-conditioned versus specialist agents: conditioning policies on a deck/faction representation, transfer between deck archetypes, generalization to unseen decks, faction-balanced training mixtures.

Known reference anchors (primary-source verification still required before citation):

- Heinrich and Silver, "Deep Reinforcement Learning from Self-Play in Imperfect-Information Games" (NFSP).
- Brown and Sandholm, "Superhuman AI for multiplayer poker" (Pluribus); Brown, Bakhtin, Lerer, Gong, "Combining Deep Reinforcement Learning and Search for Imperfect-Information Games" (ReBeL).
- Moravčík et al., "DeepStack."
- Perolat et al., "Mastering the Game of Stratego with Model-Free Multiagent Reinforcement Learning" (DeepNash / R-NaD).
- "Human-level play in the game of Diplomacy" (Cicero) and the No-Press Diplomacy line.
- Zinkevich et al. CFR and Lanctot et al. MCCFR; Brown, Lerer, Gross, Sandholm, "Deep Counterfactual Regret Minimization."
- Cowling, Powley, Whitehouse, "Information Set Monte Carlo Tree Search" (ISMCTS).
- Hostetler, Dereszynski, Dietterich, Fern (and similar) on PIMC biases for trick-taking / card games.
- Ward et al. and other Hearthstone AI competition / environment papers; Legends of Code and Magic competition papers; published Hearthstone simulator work.
- Silver et al., "Mastering the Game of Go without Human Knowledge" / AlphaZero / MuZero — for perfect-information context only, with explicit note that Gwent is imperfect-information.
- Vinyals et al., StarCraft II / AlphaStar — for action masking, large action spaces, and league play methodology.

For each paper, return:

- Full citation.
- Link / DOI / arXiv URL.
- Citation confidence / source status (`primary-source-verified`, `likely-primary-source`, `secondary-lead-only`, or `needs-verification`).
- Venue and year.
- Core method family (CFR, Deep CFR, NFSP, PSRO, MCTS, ISMCTS, self-play RL, supervised learning from human play, search + RL, mixed, other).
- Hidden-information handling (perfect information only, fully observable game, ISMCTS / determinization, belief state / particle filter, regret minimization, recurrent encoder over history, none / cheats with full state).
- Action masking / variable action set support (yes / no / partial / not addressed).
- Evaluation method (self-play win rate only, exploitability, Elo / Glicko, tournament against humans, fixed-opponent ladder, matchup matrix, other).
- Compute requirements (notable training compute, search budget, GPU/TPU footprint, or "small academic compute" if applicable).
- Relevance to this Gwent AI project (direct, partial, background-only, reject).
- Implementation risk in this project (low / medium / high) with one-sentence reason.
- One-sentence note on whether the paper could plausibly affect a Cluster F implementation spec (e.g. legal-heuristic-v1, search/self-play planner choice, ML observation/action/reward design, evaluation ladder, difficulty design) or only the long-term roadmap.

Output format:

A table FIRST, with columns:

Title | Year | Venue | Source status | Method family | Hidden-info handling | Action masking | Evaluation method | Compute | Relevance | Risk | Link

Then, AFTER the table, provide short notes for the top ~10 most promising papers (one block per paper, two to four short paragraphs each).

Classification rules:

- "Direct hit" means the paper provides a method, environment, or methodology that could plausibly become a near-term Gwent AI implementation, benchmark, or training basis (e.g. ISMCTS for card-game search, Deep CFR for an imperfect-information baseline, a Hearthstone-style environment as a structural reference, an exploitability evaluation ladder).
- "Partial hit" means the paper informs one component (action masking, opponent modeling, evaluation methodology, difficulty control), but is not by itself a full AI/ML pipeline for Gwent.
- "Background-only" means the paper is useful context (perfect-information self-play history, general RL surveys) but is unlikely to drive a concrete near-term implementation decision.

Be critical. Specifically:

- Avoid blog posts unless they explicitly point to primary sources.
- Avoid generic deep RL tutorials and "how I beat Atari with PPO" posts.
- Avoid claims that self-play converges for imperfect-information games without explicit source support; flag any paper that asserts this without imperfect-information theory backing.
- Flag papers that require hidden-information cheating (full-state observation, opponent hand visibility) without saying so explicitly — they are research papers, not honest Gwent AI candidates.
- Flag papers whose evaluation is only against weak fixed opponents without exploitability or human play comparison.
- If the literature mostly confirms that a particular method family (e.g. ISMCTS plus opponent modeling, or CFR-family methods) dominates small imperfect-information card games, say that clearly. Do not invent a "novel" candidate to be balanced.

Final note:

Do not invent citations. If you suggest a paper but are not sure of the exact citation, mark the entry as `secondary-lead-only` and note that primary-source verification is required before it can be added to this project's annotation queue.

Separate clearly:

- papers you are confident are real primary sources;
- papers that are plausible but require source verification;
- surveys or secondary sources that are useful only to discover primary citations.
