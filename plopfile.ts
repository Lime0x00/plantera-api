import type { NodePlopAPI } from 'plop';
import { execSync } from 'child_process';

export default async function (plop: NodePlopAPI) {
  plop.setActionType('format', function (answers: any) {
    const folder = answers.name
      .replace(/([a-z])([A-Z])/g, '$1-$2')
      .toLowerCase();
    console.log(`🧹 Formatting generated files for: ${folder}...`);
    try {
      execSync(
        `npx prettier --write "src/features/${folder}/**/*.ts" "src/container.ts" "src/routes/v1.ts"`,
        { stdio: 'inherit' }
      );
      return 'Formatting complete!';
    } catch (err) {
      return `Formatting failed: ${err}`;
    }
  });

  plop.setGenerator('feature', {
    description:
      'Generate a new backend module (controller, service, repository, etc.)',
    prompts: [
      {
        type: 'input',
        name: 'name',
        message: 'Enter feature name (e.g. user, garden-entry): ',
      },
    ],
    actions: [
      // Core Feature Files
      {
        type: 'add',
        path: 'src/features/{{dashCase name}}/{{dashCase name}}.controller.ts',
        templateFile: 'templates/plop/features/controller.ts.hbs',
      },
      {
        type: 'add',
        path: 'src/features/{{dashCase name}}/{{dashCase name}}.service.ts',
        templateFile: 'templates/plop/features/service.ts.hbs',
      },
      {
        type: 'add',
        path: 'src/features/{{dashCase name}}/{{dashCase name}}.repository.interface.ts',
        templateFile: 'templates/plop/features/repository.interface.ts.hbs',
      },
      {
        type: 'add',
        path: 'src/features/{{dashCase name}}/{{dashCase name}}.routes.ts',
        templateFile: 'templates/plop/features/routes.ts.hbs',
      },
      {
        type: 'add',
        path: 'src/features/{{dashCase name}}/{{dashCase name}}.messages.ts',
        templateFile: 'templates/plop/features/messages.ts.hbs',
      },
      {
        type: 'add',
        path: 'src/features/{{dashCase name}}/{{dashCase name}}.policy.ts',
        templateFile: 'templates/plop/features/policy.ts.hbs',
      },
      {
        type: 'add',
        path: 'src/features/{{dashCase name}}/index.ts',
        templateFile: 'templates/plop/features/index.ts.hbs',
      },

      // Repository Implementation
      {
        type: 'add',
        path: 'src/features/{{dashCase name}}/{{dashCase name}}.repository.ts',
        templateFile: 'templates/plop/features/repository.ts.hbs',
      },

      // DTOs
      {
        type: 'add',
        path: 'src/features/{{dashCase name}}/dtos/index.ts',
        template:
          "export * from './create.dto';\nexport * from './update.dto';\n",
      },
      {
        type: 'add',
        path: 'src/features/{{dashCase name}}/dtos/create.dto.ts',
        templateFile: 'templates/plop/features/dtos/create.ts.hbs',
      },
      {
        type: 'add',
        path: 'src/features/{{dashCase name}}/dtos/update.dto.ts',
        templateFile: 'templates/plop/features/dtos/update.ts.hbs',
      },

      // Resources
      {
        type: 'add',
        path: 'src/features/{{dashCase name}}/resources/index.ts',
        template: "export * from './{{dashCase name}}.resource';\n",
      },
      {
        type: 'add',
        path: 'src/features/{{dashCase name}}/resources/{{dashCase name}}.resource.ts',
        templateFile: 'templates/plop/features/resource.ts.hbs',
      },

      // Domain (Enums/Models)
      {
        type: 'add',
        path: 'src/features/{{dashCase name}}/domain/index.ts',
        template: "export * from './{{dashCase name}}.model';\n",
      },
      {
        type: 'add',
        path: 'src/features/{{dashCase name}}/domain/{{dashCase name}}.model.ts',
        template:
          "import { BaseModel } from '#framework/domain/base-model';\n\nexport class {{pascalCase name}} extends BaseModel {\n  static modelKey = '{{camelCase name}}';\n}\n",
      },

      // Feature Types
      {
        type: 'add',
        path: 'src/features/{{dashCase name}}/{{dashCase name}}.types.ts',
        templateFile: 'templates/plop/features/types.ts.hbs',
      },

      // --- Boilerplate Integration ---

      // 1. Register in Container
      {
        type: 'modify',
        path: 'src/container.ts',
        pattern:
          /(import { UserPolicy } from '#features\/user\/user\.policy';)/g,
        template:
          "$1\n\nimport { {{pascalCase name}}Controller } from '#features/{{dashCase name}}/{{dashCase name}}.controller';\nimport { {{pascalCase name}}Service } from '#features/{{dashCase name}}/{{dashCase name}}.service';\nimport { {{pascalCase name}}Policy } from '#features/{{dashCase name}}/{{dashCase name}}.policy';",
      },
      {
        type: 'modify',
        path: 'src/container.ts',
        pattern:
          /(import { UserRepository } from '#features\/user\/user\.repository';)/g,
        template:
          "$1\nimport { {{pascalCase name}}Repository } from '#features/{{dashCase name}}/{{dashCase name}}.repository';",
      },
      {
        type: 'modify',
        path: 'src/container.ts',
        pattern:
          /(plantController: asClass\(PlantController\)\.singleton\(\),)/g,
        template:
          '$1\n  {{camelCase name}}Controller: asClass({{pascalCase name}}Controller).singleton(),',
      },
      {
        type: 'modify',
        path: 'src/container.ts',
        pattern: /(plantService: asClass\(PlantService\)\.singleton\(\),)/g,
        template:
          '$1\n  {{camelCase name}}Service: asClass({{pascalCase name}}Service).singleton(),',
      },
      {
        type: 'modify',
        path: 'src/container.ts',
        pattern:
          /(plantRepository: asClass\(PlantRepository\)\.singleton\(\),)/g,
        template:
          '$1\n  {{camelCase name}}Repository: asClass({{pascalCase name}}Repository).singleton(),',
      },
      {
        type: 'modify',
        path: 'src/container.ts',
        pattern: /(plantPolicy: asClass\(PlantPolicy\)\.singleton\(\),)/g,
        template:
          '$1\n  {{camelCase name}}Policy: asClass({{pascalCase name}}Policy).singleton(),',
      },
      {
        type: 'modify',
        path: 'src/container.ts',
        pattern: /(plantService: c\.plantService,)/g,
        template:
          '$1\n    {{camelCase name}}Service: c.{{camelCase name}}Service,',
      },
      {
        type: 'modify',
        path: 'src/container.ts',
        pattern: /(plantPolicy: c\.plantPolicy,)/g,
        template:
          '$1\n    {{camelCase name}}Policy: c.{{camelCase name}}Policy,',
      },
      {
        type: 'modify',
        path: 'src/container.ts',
        pattern: /(plantRepository: c\.plantRepository,)/g,
        template:
          '$1\n    {{camelCase name}}Repository: c.{{camelCase name}}Repository,',
      },

      // 2. Register in Routes (v1)
      {
        type: 'modify',
        path: 'src/routes/v1.ts',
        pattern:
          /(import { userRouter } from '#features\/user\/user\.routes';)/g,
        template:
          "$1\nimport { {{camelCase name}}Router } from '#features/{{dashCase name}}/{{dashCase name}}.routes';",
      },
      {
        type: 'modify',
        path: 'src/routes/v1.ts',
        pattern: /(apiV1Router\.use\('\/users', userRouter\);)/g,
        template:
          "$1\napiV1Router.use('/{{dashCase name}}s', {{camelCase name}}Router);",
      },
      {
        type: 'format',
      },
    ],
  });
}
