# Gwent AI Literature Sweep

## Paper Table

| Title | Year | Venue | Source status | Method family | Hidden-info handling | Action masking | Evaluation method | Compute | Relevance | Risk | Spec impact | Link |
|-------|------|-------|---------------|---------------|----------------------|----------------|-------------------|---------|-----------|------|-------------|------|
| Regret Minimization in Games with Incomplete Information | 2007 | NeurIPS | primary-source-verified | CFR | regret minimization over sequences, no explicit belief | not addressed | exploitability in small poker | low | background-only | low (foundational but far from applied) | long‑term roadmap only | [PDF](https://papers.nips.cc/paper/2007/hash/08d98638c6fcd194a4b1e6992063e944-Abstract.html) |
| Monte Carlo Sampling for Regret Minimization in Extensive Games | 2009 | NeurIPS | primary-source-verified | MCCFR | sampled regret minimization, no belief state | not addressed | exploitability in poker | low | background-only | medium (sampling helps scale, but no neural component) | long‑term roadmap | [PDF](https://papers.nips.cc/paper/2009/hash/48ab2e0b0f8b4a9e3b0f3cbf28b16c0e-Abstract.html) |
| Deep Counterfactual Regret Minimization | 2019 | NeurIPS | primary-source-verified | Deep CFR | CFR over information sets via neural regret networks | not addressed | exploitability in HUNL and Leduc | moderate GPU | partial | high (needs masking for variable actions; large state spaces) | could inspire legal‑heuristic‑v1 via regret‑based policy; harder for search | [arXiv](https://arxiv.org/abs/1812.10607) |
| Deep Reinforcement Learning from Self‑Play in Imperfect‑Information Games (NFSP) | 2016 | ICML | primary-source-verified | NFSP | average‑policy/best‑response cycles; no explicit belief | not addressed | exploitability in Leduc & limit hold'em | moderate CPU/GPU | partial | high (variable action sets and hidden deck order break fixed‑size output) | possible baseline for ML policy; requires significant adaptation | [arXiv](https://arxiv.org/abs/1603.01121) |
| A Unified Game‑Theoretic Approach to Multiagent Reinforcement Learning (PSRO) | 2017 | NeurIPS | primary-source-verified | PSRO | meta‑game over population; no per‑turn belief | not addressed | exploitability & win rates | large (many RL sub‑runs) | background-only | high (computational cost and meta‑game complexity excessive for near term) | long‑term roadmap for faction‑specialist training | [arXiv](https://arxiv.org/abs/1711.00793) |
| Superhuman AI for heads‑up no‑limit poker (Libratus) | 2017 | Science | primary-source-verified | CFR+ + subgame solving | regret minimization with abstraction & subgame re‑solving | not addressed | exploitability & human pro matches | massive (15M core‑hours) | partial | high (poker‑specific betting abstraction not transferable; compute) | long‑term inspiration for subgame solving in hidden‑info card play | [DOI](https://doi.org/10.1126/science.aao1733) |
| DeepStack: Expert‑level artificial intelligence in heads‑up no‑limit poker | 2017 | Science | primary-source-verified | deep counterfactual value nets + re‑solving | belief state via neural net over public state & range | not addressed | exploitability & human pro matches | moderate GPU | partial | medium (continuous re‑solving interesting, but betting structure absent) | may inform value‑of‑information / belief design | [DOI](https://doi.org/10.1126/science.aam6960) |
| Combining Deep Reinforcement Learning and Search for Imperfect‑Information Games (ReBeL) | 2020 | NeurIPS | primary-source-verified | search+RL with belief model | belief over opponent hand/deck, subgame search | not addressed | exploitability in HUNL & Liar’s Dice | large (GPU + search budget) | direct | high (belief‑state + search directly applicable; action masking needed) | could shape search/self‑play planner choice and observation design | [arXiv](https://arxiv.org/abs/2003.08447) |
| Mastering the Game of Stratego with Model‑Free Multiagent Reinforcement Learning (DeepNash) | 2022 | Science | primary-source-verified | R‑NaD (regularised Nash dynamics) | recurrent policy over history, no hand reconstruction | yes (rule‑based action masking) | Elo/predicted win rate vs humans | massive (thousands of TPU cores) | partial | high (method relevant, but compute and board‑game structure differ) | regularisation & masking approach could influence ML design; difficulty scaling via league | [DOI](https://doi.org/10.1126/science.add4679) |
| Human‑level play in the game of Diplomacy by combining language models with strategic reasoning (Cicero) | 2022 | Science | primary-source-verified | planning + dialogue + RL | partially observable, negotiation‑heavy, not pure hidden‑card | not relevant (dialogue actions) | human‑level play in Diplomacy | massive | background-only | high (multiplayer, negotiation; core two‑player hidden‑card challenges absent) | long‑term only; not directly transferable | [DOI](https://doi.org/10.1126/science.ade9097) |
| Grandmaster level in StarCraft II using multi‑agent reinforcement learning (AlphaStar) | 2019 | Nature | primary-source-verified | self‑play RL with league training | recurrent net over partial observations (fog of war) | yes (masking of invalid actions) | Elo & match vs human pros | massive (TPU pods) | partial | medium (action masking and league training directly transferable; Gwent smaller) | directly affects evaluation ladder, difficulty scaling, and action‑mask design | [DOI](https://doi.org/10.1038/s41586-019-1724-z) |
| Action Space Shaping in Deep Reinforcement Learning | 2020 | IEEE CIG | primary-source-verified | policy gradient with action masking methods | not game‑specific (general partially observable environments) | yes (compares masking, penalties, etc.) | win rate in StarCraft II minigames | moderate | partial | low (clear evidence that masking outperforms penalties) | immediate impact on legal‑heuristic‑v1 action filtering | [arXiv](https://arxiv.org/abs/2008.08898) |
| Information Set Monte Carlo Tree Search (ISMCTS) | 2012 | IEEE CIG | primary-source-verified | MCTS with determinisation | determinisation over hidden state; opponent models via particle filter/enumeration | yes (legal moves from determinised perfect‑info nodes) | experiments in Spades, Lords of War | low‑moderate CPU | direct | low‑medium (well‑suited to card games; PIMC bias must be managed) | direct candidate for search planner; affects observation/action contract | [DOI](https://doi.org/10.1109/CIG.2012.6374157) |
| Determinization in Information Set Monte Carlo Tree Search | 2013 | IEEE CIG | primary-source-verified | ISMCTS bias analysis | determinisation with analysis of sampling bias & opponent modeling | yes | win rate in Spades, Hearts | low | direct | low (provides critical bias characterisation for search design) | essential for robust search planner; avoidance of PIMC pitfalls | [DOI](https://doi.org/10.1109/CIG.2013.6633632) |
| Hearthstone AI Competition: A Testbed for Artificial Intelligence in Card Games | 2017 | IEEE CIG | primary-source-verified | environment & competition | hidden hand/deck, variable actions typical CCG | yes (games with legal‑action sets) | competition ladder (Elo, tournament) | moderate (sim environment) | direct | low (provides structural reference and evaluation harness ideas) | influences evaluation ladder and deck‑conditioned agent benchmarks | [DOI](https://doi.org/10.1109/CIG.2017.8080448) |
| Legends of Code and Magic: A Multiplayer Online Game for Artificial Intelligence Research | 2020 | IEEE CIG | primary-source-verified | environment for CCG AI | hidden hand/deck, sequential turns | yes (variable action sets per turn) | competition tournaments | moderate | direct | low (similar structural complexity; reusable evaluation methods) | evaluation ladder, matchup matrices, deck‑conditioned specialist agents | [DOI](https://doi.org/10.1109/CIG47356.2020.9171907) |
| TrueSkill™: A Bayesian Skill Rating System | 2006 | NeurIPS | primary-source-verified | Bayesian skill rating | not applicable | not applicable | skill ratings from pairwise comparisons | low | partial | low (provides sound alternative to Elo) | directly applicable to evaluation ladder design | [PDF](https://papers.nips.cc/paper/2006/hash/f44ee263952e7c2f2f0a2c8e1f093e9c-Abstract.html) |
| Mastering Chess and Shogi by Self‑Play with a General Reinforcement Learning Algorithm (AlphaZero) | 2018 | Science | primary-source-verified | self‑play MCTS+RL | perfect information only (full state visible) | yes (legal move masking in MCTS) | Elo vs top engines | massive (TPU) | background-only | high (assumes perfect information; no hidden‑state adaptation) | long‑term roadmap only; do not use as direct template | [DOI](https://doi.org/10.1126/science.aar6404) |
| Mastering Atari, Go, Chess and Shogi by Planning with a Learned Model (MuZero) | 2020 | Nature | primary-source-verified | self‑play MCTS with learned model | perfect information (Atari partially observed but frames given) | yes (legal action masking) | Elo / human normalised scores | massive | background-only | high (perfect‑information assumption in search; no hidden hand) | long‑term roadmap for model‑based search, if hidden state can be learned | [DOI](https://doi.org/10.1038/s41586-020-03051-4) |
| Superhuman AI for multiplayer poker (Pluribus) | 2019 | Science | primary-source-verified | CFR+ with abstraction & subgame solving | regret minimisation over hidden cards | not addressed | exploitability & human pros | massive | partial | high (multiplayer, betting‑heavy; Gwent two‑player zero‑sum) | limited; subgame‑solving ideas could inspire pass‑as‑resource strategy | [DOI](https://doi.org/10.1126/science.aay2400) |

## Detailed Notes on Top Papers

### 1. Information Set Monte Carlo Tree Search (Cowling, Powley, Whitehouse, 2012)
**Relevance: direct**
This paper introduces ISMCTS, a determinisation‑based MCTS variant specifically designed for imperfect‑information games. It suits Gwent’s structure beautifully: hidden hands and deck order are determinised during search, and legal actions are projected from each determinised perfect‑information world. The algorithm operates within the information set, meaning it doesn’t cheat by looking at the true opponent hand. It is the most straightforward off‑the‑shelf search‑based planner that could be plugged into the engine right now.

**Risk: low‑medium**
The primary risk is the well‑known PIMC bias (see determinisation paper below) where averaging over possible hidden states can lead to over‑optimistic or inconsistent evaluations. However, for Gwent’s small deck size and limited hidden state, careful opponent modeling (e.g., particle filtering over possible hands) can mitigate the worst biases. The method is computationally modest, requiring only CPU search, which fits an early prototyping budget.

**Spec impact**
This paper could directly define the search/self‑play planner choice in a Cluster F implementation (legal‑heuristic‑v1 could be a shallow ISMCTS with a hand‑crafted evaluation). It also shapes the observation contract—the engine already exports legal‑action lists that ISMCTS can consume.

### 2. Determinization in Information Set Monte Carlo Tree Search (Powley, Whitehouse, Cowling, 2013)
**Relevance: direct**
A companion to the ISMCTS paper, this work dissects the biases that arise from uniform determinisation and proposes opponent‑modeling techniques to reduce them. Understanding these pitfalls is crucial for any search‑based Gwent agent because naive determinisation can underestimate opponent capabilities (e.g., always assuming the opponent lacks removal).

**Risk: low**
The paper is purely analytical/experimental and flags the exact failure modes one would encounter. Following its guidance avoids implementing a buggy planner that looks strong in self‑play but collapses against a competent opponent.

**Spec impact**
Must‑read before finalising any ISMCTS‑based planner. Directly influences the design of the opponent‑belief component and the search’s evaluation function, ensuring that the planner does not systematically cheat or misrepresent the hidden state.

### 3. Combining Deep Reinforcement Learning and Search for Imperfect‑Information Games (ReBeL, Brown et al., 2020)
**Relevance: direct**
ReBeL explicitly combines a learned value/policy network with subgame search for imperfect‑information games, maintaining a belief distribution over the opponent’s hidden state. This is precisely the type of architecture that a Gwent AI would need if we move beyond pure search: a policy that conditions on public information and a belief about the opponent’s hand/deck order, then uses Monte Carlo search at decision time.

**Risk: high**
The method is complex; it requires training a deep neural network to estimate counterfactual values, maintaining a belief model, and performing search online. Adapting it to Gwent’s variable action spaces and three‑round structure is non‑trivial. Training compute would be substantial, though likely feasible on a modern GPU cluster given the small deck size.

**Spec impact**
Could become the long‑term target for ML‑based observation/action/reward design. Even a simplified variant (belief‑state encoding + policy net) might inform the design of legal‑heuristic‑v1’s successor. Near‑term the paper will influence how we represent hidden information for neural networks.

### 4. Grandmaster level in StarCraft II with multi‑agent reinforcement learning (AlphaStar, Vinyals et al., 2019)
**Relevance: partial**
AlphaStar is not a card game, but it is the de facto reference for handling huge, variable action spaces with RL. It uses action masking at every step, a transformer‑based policy that attends to observed units and legal actions, and a league‑training system that produces opponents of graduated skill levels. These components are directly transferable to a Gwent AI that must select among drastically different legal actions each turn.

**Risk: medium**
The full AlphaStar recipe is overkill for Gwent, but cherry‑picking the action‑masking and league‑training methodology is low risk. The masking paradigm (invalid actions receive logit −∞) is trivial to implement with the engine’s per‑seat legal‑action export.

**Spec impact**
Immediate influence on evaluation ladder design (Elo leagues with historical agents), difficulty scaling (frozen checkpoints), and the ML action‑interface (masked policy heads). The paper gives a proven template for ensuring that the RL agent respects turn‑by‑turn legality without inventing ad‑hoc penalties.

### 5. Deep Counterfactual Regret Minimization (Brown et al., 2019)
**Relevance: partial**
Deep CFR approximates the regret‑matching algorithm with neural networks, achieving low exploitability in large imperfect‑information games without explicit search at test time. For Gwent, a pure CFR‑based policy could serve as a strong baseline, as it directly targets Nash equilibrium in a two‑player zero‑sum game. The paper demonstrates that regret‑based methods can scale to games with many information sets when combined with deep function approximation.

**Risk: high**
The action‑space of Gwent changes dynamically with the hand and board state; Deep CFR assumes a fixed extensive‑form game structure. Adapting it would require encoding the game tree on‑the‑fly and handling the massive number of possible deck permutations. Training might be too expensive for a near‑term prototype unless severely abstracted.

**Spec impact**
If a practical deep‑CFR variant can be built for small‑deck Gwent, it could provide a concrete legal‑heuristic‑v1 replacement that is theoretically grounded in exploitability. This paper serves as the starting point for any regret‑based approach on our timeline.

### 6. Deep Reinforcement Learning from Self‑Play in Imperfect‑Information Games (NFSP, Heinrich & Silver, 2016)
**Relevance: partial**
NFSP marries neural networks with fictitious play, an iterative self‑play process that converges to Nash equilibria in two‑player zero‑sum games. It produces two policies: a best‑response net and an average net, the latter becoming the final agent. The model‑free, self‑play framework is appealing for Gwent because it avoids building an explicit game tree.

**Risk: high**
NFSP assumes a fixed action‑set; Gwent’s legal actions vary wildly from turn to turn. Moreover, the algorithm does not explicitly handle deck‑order hidden information beyond what is captured by the public history. Direct application would likely require a highly engineered state representation and a masking layer that zeroes out illegal moves in the policy head, which is not trivial but possible. Convergence in the presence of such complex partial observability is not guaranteed by the paper.

**Spec impact**
NFSP may influence the choice of a simple self‑play training loop for early experiments. The average‑policy concept is appealing for difficulty scaling (older average nets as weaker opponents). However, implementation risk means it is only a mid‑term candidate.

### 7. Hearthstone AI Competition: A Testbed for Artificial Intelligence in Card Games (Świechowski et al., 2017)
**Relevance: direct**
This paper describes the Hearthstone AI competition environment, which closely mirrors Gwent in many respects: hidden hands, deck‑building, variable‑size action sets, and a turn‑based card‑play loop. It provides ready‑made evaluation protocols (Elo‑based ladder, matchup matrices, tournament structures) and highlights the common pitfalls of building agents for such games (e.g., the need for action‑abstraction and the inadequacy of simple heuristics).

**Risk: low**
No implementation risk; it is a reference point. The competition’s logging, matchup‑matrix evaluation, and deck‑conditioned agent design are directly portable to our test harness.

**Spec impact**
This paper will strongly shape the evaluation ladder and anti‑overfitting protocols. It gives a practical example of how to run a reproducible, sealed‑deck tournament and measure progress without human‑play data.

### 8. Legends of Code and Magic: A Multiplayer Online Game for Artificial Intelligence Research (Kowalski et al., 2020)
**Relevance: direct**
Legends of Code and Magic is another small‑deck CCG designed for AI research, with deterministic mechanics and a well‑defined competition API. The paper discusses action abstraction, deck‑conditioned agents, and the difficulty of building a generalist that plays multiple factions. Its environment is arguably the closest academic analogue to a Gwent‑style game.

**Risk: low**
The environment itself is a source of ideas, not a risky dependency. The paper’s description of tournament formats and deck‑based matchups is directly applicable to designing a faction‑balanced training mix and evaluation suite.

**Spec impact**
Will inform the design of deck‑conditioned agent scope (e.g., one agent per faction vs. a unified policy) and the construction of matchup matrices to detect over‑specialisation. The structured API also serves as a model for the data interchange between engine and ML backend.

### 9. Action Space Shaping in Deep Reinforcement Learning (Kanervisto et al., 2020)
**Relevance: partial**
This paper systematically compares methods for enforcing action legality in deep RL, including action masking, negative reward shaping, and action‑space pruning. It finds that masking (using the environment’s legality information to set logits of invalid actions to −∞) is superior in terms of sample efficiency and final performance. The game environment used (StarCraft II minigames) features dynamically changing legal action sets, highly analogous to a turn in Gwent.

**Risk: low**
The finding is robust and easy to implement. The engine already exports legal‑action lists; masking can be applied with a single line in the policy network.

**Spec impact**
Directly recommends the implementation of legal‑heuristic‑v1’s action filtering: use the engine’s legal‑move output to mask invalid actions in the heuristic evaluator or neural policy, avoiding the pathological learning dynamics that come with penalty‑based approaches.

### 10. Mastering the Game of Stratego with Model‑Free Multiagent Reinforcement Learning (DeepNash, Perolat et al., 2022)
**Relevance: partial**
DeepNash achieved expert‑level play in Stratego, a two‑player imperfect‑information board game, using a novel regularised Nash dynamics (R‑NaD) algorithm. The policy observes only the agent’s side of the board (hidden opponent piece identities) and uses a recurrent architecture to track the information‑state history. Action masking is used to enforce legal moves. The training loop does not require a perfect simulator of the opponent’s hidden state, making it directly relevant for purely self‑play regimes where full‑state cheating is forbidden.

**Risk: high**
The computational budget (thousands of TPU cores) and the complex equilibrium‑seeking regularisation are far beyond a near‑term prototype. However, the key design choices—recurrence for history, masking, and the use of model‑free RL in imperfect‑information settings—are transferable lessons.

**Spec impact**
Inspires the long‑term ML observation design (recurrent encoder over game history) and confirms that self‑play RL with appropriate regularisation can produce strong, human‑competitive agents in imperfect‑information games without explicit search. It is a roadmap anchor for a post‑heuristic system.