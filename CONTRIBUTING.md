# Guide de Contribution pour InstaInsights

Merci de considerer de contribuer a InstaInsights. Nous appreciemmons votre implication pour l'amelioration de notre application. Ce document definit les regles et standards que tous les developpeurs doivent respecter afin de garantir un processus de collaboration fluide et constant.

## 1. Mise en Place de l'Environnement

Pour contribuer efficacement, veuillez vous assurer que votre environnement local est correctement configure avec les outils suivants :
- Node.js (version 20 ou superieure)
- npm (version 10 ou superieure)

Etapes d'installation :
1. Clonez le depot et rendez-vous dans le repertoire principal : \`cd insta-insights/webapp\`
2. Installez les dependances : \`npm install\`
3. Copiez le fichier d'environnement : \`cp .env.example .env.local\`
4. Configurez votre cle API Gemini dans le fichier \`.env.local\`.
5. Lancez l'environnement de developpement : \`npm run dev\`

## 2. Strategie de Branche (Branching)

Veuillez adherer a la convention de nommage decrite ci-dessous pour toutes vos nouvelles branches. Aucun nom ne doit deroger a ces prefixes :
- \`feat/nom-de-la-fonctionnalite\` : Pour tout ajout de fonction ou amelioration majeur.
- \`fix/nom-du-bug\` : Pour la resolution de dysfonctionnements ou correctifs.
- \`docs/titre-du-changement\` : Uniquement pour les mises a jour de documentation (README, guides, etc.).
- \`chore/tache-maintenance\` : Pour la mise a jour de dependances ou de fichiers de configuration mineurs.

## 3. Qualite et Documentation du Code

### Standards de Documentation
- **Aucun emoji** : Il est strictement interdit d'utiliser des emojis dans le code source, les commentaires, et la documentation (incluant ce guide, les fichiers markdown, les issues et les Pull Requests). Abstenez-vous de facon comprehensive.
- **JSDoc** : Toutes les fonctions majeures, les hooks personnalises et les composants doivent etre documentes avec des commentaires au format JSDoc clairs decrivant les parametres, le type de retour, ainsi que la fonction generale du code.
- **Langue** : Redigez tous les commentaires dans le code et les messages de commit de maniere professionelle. Le code lui-meme (noms de variables/fonctions) doit rester en anglais.

### Qualite
Assurez-vous d'avoir execute ces commandes avant de soumettre vos modifications :
- \`npm run lint\` : Verification ESLint (max 25 avertissements toleres).
- \`npm run format\` : Formatage via Prettier.
- \`npm run type-check\` : Validation des types TypeScript sans emettre de fichiers.

## 4. Tests et Couverture (Testing)

Nous visons un haut niveau de confiance dans notre code. Les exigences suivantes doivent etre atteintes :
- **Couverture de 100%** : Le code recemment ajoute doit inclure des tests unitaires et d'integration visant un objectif strict de 100% de couverture de code (Branches, Fonctions, Lignes).
- Framework de test : Jest avec l'environnement jsdom. (React Testing Library est disponible pour les tests de composants).
- Commande validation locale : \`npm run test:coverage\`
- Tout fichier modifie ou ajoute doit inclure son fichier specifique de tests dans le dossier \`__tests__\`.

## 5. Messages de Commit

Les commits doivent obeir aux normes des "Conventional Commits" pour la clarete de l'historique et la generation automatique possible de Changelogs.
- Format : \`type(scope): message concis\`
- Exemple : \`feat(collabs): ajout de la recherche par centre d'interet\`
- Exemple : \`docs: mise a jour du guide d'installation\`
- Exemple : \`fix(mediakit): correction du rendu pdf\`

Husky verifiera automatiquement votre message de commit et bloquera l'action si ces regles ne sont pas scrupuleusement suivies.

## 6. Processus de Pull Request (PR)

1. Mettez a jour et executez les tests : verifiez que \`npm run test:coverage\` ne decline en rien le pourcentage de couverture existant.
2. Creez votre Pull Request depuis votre branche \`feat/*\` ou \`fix/*\` vers la branche \`main\`.
3. Assurez-vous que l'integration continue (CI) passe toutes ces etapes de verification de qualite, securite et tests.
4. Un membre de l'equipe procedera a la revue de votre code et apportera ses remarques.

Nous vous remercions sincerement pour votre temps et vos efforts pour maintenir la robustesse d'InstaInsights.
