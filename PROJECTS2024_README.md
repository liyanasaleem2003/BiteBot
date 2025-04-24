# BiteBot - Repository Structure

This repository contains a mirror of the BiteBot project from two primary sources:
- https://git.cs.bham.ac.uk/lxs211/bitebot
- https://github.com/liyanasaleem2003/BiteBot

## Branch Structure

- `main`: The primary branch containing the latest version of the codebase

## About BiteBot

BiteBot is a comprehensive wellness platform that helps users maintain a healthy lifestyle while staying connected to their South Asian culinary roots. The application combines modern nutritional science with traditional South Asian cooking to provide personalized meal recommendations, recipe modifications, and health tracking.

## Repository Mirroring Setup

The repository has been configured with custom Git aliases to enable pushing to and pulling from all repositories simultaneously:

```bash
git pushall  # Pushes to github, gitlab, and projects2024 repositories (main branch)
git pullall  # Pulls from github, gitlab, and projects2024 repositories (main branch)
```

These commands will ensure that all repositories stay in sync.

## How to Contribute

For contributions, please push to the original repositories and the changes will be mirrored here:
1. Make your changes
2. Commit to your local branch
3. Use `git pushall` to update all repositories

Please see the main README.md for more detailed information about the project features and setup instructions. 