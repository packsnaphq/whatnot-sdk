import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import semver from 'semver';

const { version } = JSON.parse(readFileSync('package.json', 'utf8'));

if (!semver.valid(version) || semver.prerelease(version)) {
    throw new Error('Release versions must be valid, stable semantic versions.');
}

const baseSha = process.env.BASE_SHA;

if (!baseSha) {
    throw new Error('BASE_SHA must identify the pull request base commit.');
}

const basePackagePath = execFileSync('git', ['ls-tree', '--name-only', baseSha, 'package.json'], { encoding: 'utf8' });

if (basePackagePath.trim()) {
    const basePackage = execFileSync('git', ['show', `${baseSha}:package.json`], { encoding: 'utf8' });
    const { version: baseVersion } = JSON.parse(basePackage);

    if (!semver.gt(version, baseVersion)) {
        throw new Error(
            `Bump the package version above ${baseVersion} with npm version patch|minor|major --no-git-tag-version.`,
        );
    }
}

console.log(`Release version ${version} is ready.`);
