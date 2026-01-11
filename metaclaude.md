ou are an expert at creating optimal CLAUDE.md files for Claude Code projects.

Your task: Analyze this project and generate a highly effective CLAUDE.md file.

## Analysis Phase

1. **Project Structure**
   - Scan the directory tree and identify key directories
   - List the main components and their purposes
   - Identify any monorepo structure or unusual layouts

2. **Dependencies & Ecosystem**
   - Read package.json / pyproject.toml / go.mod / Cargo.toml / gemfile
   - Extract key dependencies and versions
   - Identify the primary framework/runtime

3. **Build & Test Commands**
   - Find all npm/pip/cargo/make scripts
   - Identify build, test, lint, and type-check commands
   - Note any environment setup requirements (pyenv, nvm, ruby version)

4. **Code Patterns**
   - Scan 3-5 key source files in each directory
   - Identify naming conventions (camelCase, snake_case, PascalCase)
   - Detect type usage patterns (TypeScript, Pydantic, etc.)
   - Find import/module patterns (ES6, CommonJS, Go interfaces, etc.)

5. **Testing Patterns**
   - Identify test framework (Jest, pytest, unittest, Mocha, etc.)
   - Find test file naming conventions
   - Detect fixture/setup patterns
   - Look for test configuration files (jest.config.js, pytest.ini, etc.)

6. **Existing Documentation**
   - Read README.md, CONTRIBUTING.md, docs/
   - Extract any style guides or architecture docs
   - Note any CI/CD workflows (.github/workflows, .gitlab-ci.yml)

7. **Git & Workflow**
   - Check for existing git hooks
   - Look for conventional commit patterns in git history
   - Identify branch naming conventions (main/master, feature/, bugfix/)

## Generation Phase

Output a CLAUDE.md file with these exact sections:

# CLAUDE.md - [Project Name]

## Quick Start

- **Build**: [EXACT_COMMAND]
- **Test**: [EXACT_COMMAND]
- **Dev Server**: [EXACT_COMMAND]
- **Lint/Format**: [EXACT_COMMAND]

## Project Structure

[TREE OUTPUT with 2-3 line descriptions]

src/
├── components/ # React components with hooks
├── hooks/ # Custom React hooks
├── services/ # API and external service calls
├── types/ # TypeScript interface definitions
└── utils/ # Helper functions and constants

## Tech Stack

- **Runtime**: [Node.js 18.x / Python 3.11 / Go 1.21]
- **Framework**: [Next.js 14 / FastAPI / Gin]
- **Database**: [PostgreSQL / MongoDB / None]
- **State Management**: [Redux / Zustand / React Query / None]
- **Styling**: [Tailwind CSS / Styled Components / CSS Modules]

## Code Style

### Naming Conventions
- **Files**: snake_case for files, PascalCase for components
- **Functions**: camelCase for functions, UPPER_SNAKE_CASE for constants
- **Classes/Types**: PascalCase for classes and interfaces
- **Private members**: _leadingUnderscore for private methods/fields

### TypeScript/Python Specifics
- [Always use strict types / No `any` allowed]
- [All functions must have return type annotations]
- [Use explicit imports, avoid wildcard imports]

### Import/Module Patterns
- Use ES6 modules with proper extensions: `import { foo } from './bar.js'`
- Order imports: external > internal > side effects
- Destructure when importing multiple items

## Testing

- **Framework**: [Jest / pytest / Go testing]
- **Location**: Tests live in `__tests__/` directories or `*.test.ts` co-located with source
- **Naming**: `[filename].test.ts` or `test_[filename].py`
- **Pattern**: Use [describe/it / test_* functions / TestCase]
- **Run**: `npm test` (watch: `npm run test:watch`)
- **Coverage**: Aim for >80% coverage on critical paths

## Important Patterns & Gotchas

### Database/API Patterns
- [Pattern description from codebase analysis]
- [Any non-obvious architectural decision]

### Common Mistakes to Avoid
- Never modify [X] without also updating [Y]
- Always run [LINT_COMMAND] before committing
- Be aware of [GOTCHA] - it behaves differently in [SCENARIO]

### Performance Considerations
- [Any known bottlenecks or optimization requirements]
- [Caching strategies if applicable]

## Git & Workflow

- **Branch naming**: `feature/description` or `fix/description`
- **Commits**: Use conventional commits: `feat:`, `fix:`, `refactor:`, `docs:`, `test:`
- **PR process**: PRs require passing tests + code review before merge
- **Merge strategy**: Squash and merge to keep history clean

## Environment Setup

- **Node version**: Use `nvm use` (defined in .nvmrc)
- **Python version**: Use `pyenv shell 3.11` (defined in .python-version)
- **Dependencies**: Run `npm install` or `pip install -r requirements.txt`
- **Database**: [Setup instructions if applicable]

## Commonly Used Tools/Utilities

[List project-specific CLI commands, custom scripts, or utility functions that Claude should know about]

- `npm run analyze` - Generate bundle size report
- `./scripts/migrate.sh` - Run database migrations
- Custom hook: `useAsync()` for data fetching

## Performance & Debugging

[Any tips for debugging, profiling, or working efficiently in this codebase]

## Known Issues & Workarounds

[Project-specific warnings or workarounds]

## Continuous Learning

Document learnings here as you encounter new patterns:
- *[DATE]*: [LESSON_LEARNED] - affects [FILE/COMPONENT]