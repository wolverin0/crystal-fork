import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

export class ClaudeStateService {
  private claudeDir: string;

  constructor() {
    this.claudeDir = path.join(os.homedir(), '.claude');
  }

  /**
   * Tries to find the project folder in ~/.claude/projects that corresponds to the given project path.
   * Since the slugification logic is opaque, we'll try a fuzzy match or search.
   */
  private async findProjectFolder(projectPath: string): Promise<string | null> {
    const projectsDir = path.join(this.claudeDir, 'projects');
    try {
      const entries = await fs.readdir(projectsDir);
      
      // Simple heuristic: construct a basic slug and find the closest match
      // Or, since we assume the mapping is consistent, maybe we can reverse engineer it?
      // Based on observation:
      // / -> -
      // . -> -
      // _ -> -
      // space -> -
      
      // Let's try to normalize the input path and the directory names to compare
      // Remove all non-alphanumeric characters for comparison
      const normalize = (s: string) => s.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
      const target = normalize(projectPath);

      for (const entry of entries) {
        // The folder name usually starts with - (representing root /)
        // Let's normalize the entry name too
        if (normalize(entry) === target) {
          return path.join(projectsDir, entry);
        }
      }
      
      // Fallback: try to find one that contains significant parts
      const parts = projectPath.split(path.sep).filter(p => p.length > 0);
      // Try to find a folder that contains all parts in order?
      // Too risky.
      
      return null;
    } catch (error) {
      console.error('Error listing .claude/projects:', error);
      return null;
    }
  }

  /**
   * Retrieves the plan linked to a specific Claude session.
   */
  async getLinkedPlan(projectPath: string, claudeSessionId: string): Promise<{ name: string; content: string; path: string } | null> {
    try {
      const projectFolder = await this.findProjectFolder(projectPath);
      if (!projectFolder) {
        console.warn(`Could not find .claude project folder for path: ${projectPath}`);
        return null;
      }

      const sessionFile = path.join(projectFolder, `${claudeSessionId}.jsonl`);
      
      // Check if file exists
      try {
        await fs.access(sessionFile);
      } catch {
        console.warn(`Session file not found: ${sessionFile}`);
        return null;
      }

      // Read file line by line to find "slug"
      // We don't want to read 73MB into memory
      // We'll read the first few chunks, or use a stream
      
      const fileHandle = await fs.open(sessionFile, 'r');
      const stream = fileHandle.createReadStream({ encoding: 'utf8', highWaterMark: 64 * 1024 }); // 64KB chunks

      let buffer = '';
      let slug: string | null = null;

      for await (const chunk of stream) {
        buffer += chunk;
        
        // Check for "slug":"..." pattern
        // It's usually at the beginning of the file (metadata line)
        const match = buffer.match(/"slug"\s*:\s*"([^"]+)"/);
        if (match) {
          slug = match[1];
          break; // Found it
        }

        // Keep buffer size reasonable, but ensure we don't cut a match in half
        // "slug":"..." is short, so keeping last 100 chars + new chunk should be enough
        if (buffer.length > 1000) {
           buffer = buffer.slice(-200); 
        }
      }
      
      await fileHandle.close();

      if (!slug) {
        console.warn(`No plan slug found in session file: ${sessionFile}`);
        return null;
      }

      const planPath = path.join(this.claudeDir, 'plans', `${slug}.md`);
      const content = await fs.readFile(planPath, 'utf-8');

      return {
        name: slug,
        path: planPath,
        content
      };

    } catch (error) {
      console.error('Error getting linked plan:', error);
      return null;
    }
  }

  /**
   * Checks the status of CLAUDE.md in the project root.
   */
  async getClaudeMdStatus(projectRoot: string): Promise<{ exists: boolean; lastUpdated?: Date; stale: boolean }> {
    const claudeMdPath = path.join(projectRoot, 'CLAUDE.md');
    try {
      const stats = await fs.stat(claudeMdPath);
      const now = new Date();
      const oneWeek = 7 * 24 * 60 * 60 * 1000;
      const age = now.getTime() - stats.mtime.getTime();
      
      return {
        exists: true,
        lastUpdated: stats.mtime,
        stale: age > oneWeek
      };
    } catch {
      return { exists: false, stale: false };
    }
  }

  /**
   * Backs up CLAUDE.md to a backups folder.
   */
  async backupClaudeMd(projectRoot: string): Promise<string> {
    const claudeMdPath = path.join(projectRoot, 'CLAUDE.md');
    
    // Check existence
    try {
      await fs.access(claudeMdPath);
    } catch {
      throw new Error('CLAUDE.md not found');
    }

    // Determine backup location
    // Prefer .claude/backups if .claude exists, else project/backups
    const dotClaude = path.join(projectRoot, '.claude');
    let backupDir = path.join(projectRoot, 'backups');
    
    try {
        await fs.access(dotClaude);
        // .claude exists, use it
        backupDir = path.join(dotClaude, 'backups');
    } catch {
        // .claude does not exist, use root backups
    }

    await fs.mkdir(backupDir, { recursive: true });

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupName = `claude.md-${timestamp}`;
    const backupPath = path.join(backupDir, backupName);

    await fs.copyFile(claudeMdPath, backupPath);
    
    return backupPath;
  }

  /**
   * Returns the Metaclaude template for regenerating CLAUDE.md.
   */
  async getMetaclaudeTemplate(): Promise<string> {
    return `You are an expert at creating optimal CLAUDE.md files for Claude Code projects.

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
- [Always use strict types / No \`any\` allowed]
- [All functions must have return type annotations]
- [Use explicit imports, avoid wildcard imports]

### Import/Module Patterns
- Use ES6 modules with proper extensions: \`import { foo } from './bar.js'\`
- Order imports: external > internal > side effects
- Destructure when importing multiple items

## Testing

- **Framework**: [Jest / pytest / Go testing]
- **Location**: Tests live in \`__tests__/\` directories or \`*.test.ts\` co-located with source
- **Naming**: \`[filename].test.ts\` or \`test_[filename].py\`
- **Pattern**: Use [describe/it / test_* functions / TestCase]
- **Run**: \`npm test\` (watch: \`npm run test:watch\`)
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

- **Branch naming**: \`feature/description\` or \`fix/description\`
- **Commits**: Use conventional commits: \`feat:\`, \`fix:\`, \`refactor:\`, \`docs:\`, \`test:\`
- **PR process**: PRs require passing tests + code review before merge
- **Merge strategy**: Squash and merge to keep history clean

## Environment Setup

- **Node version**: Use \`nvm use\` (defined in .nvmrc)
- **Python version**: Use \`pyenv shell 3.11\` (defined in .python-version)
- **Dependencies**: Run \`npm install\` or \`pip install -r requirements.txt\`
- **Database**: [Setup instructions if applicable]

## Commonly Used Tools/Utilities

[List project-specific CLI commands, custom scripts, or utility functions that Claude should know about]

- \`npm run analyze\` - Generate bundle size report
- \`./scripts/migrate.sh\` - Run database migrations
- Custom hook: \`useAsync()\` for data fetching

## Performance & Debugging

[Any tips for debugging, profiling, or working efficiently in this codebase]

## Known Issues & Workarounds

[Project-specific warnings or workarounds]

## Continuous Learning

Document learnings here as you encounter new patterns:
- *[DATE]*: [LESSON_LEARNED] - affects [FILE/COMPONENT]
`;
  }
}
