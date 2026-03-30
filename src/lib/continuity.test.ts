import { describe, expect, it } from 'vitest'

import { sampleProject } from '../data/sampleProject'
import { generateContinuityReport } from './continuity'

const clone = <T,>(value: T): T => structuredClone(value)

describe('generateContinuityReport', () => {
  it('reports the expected issue totals for the sample project', () => {
    const report = generateContinuityReport(sampleProject)

    expect(report.totalScenes).toBe(3)
    expect(report.totalIssues).toBe(8)
    expect(report.criticalCount).toBe(1)
    expect(report.issues.map((issue) => issue.category)).toEqual(
      expect.arrayContaining([
        'missing-character-core',
        'age-mismatch',
        'missing-entity-reference',
        'state-conflict',
        'relationship-asymmetry',
      ]),
    )
  })

  it('skips missing-core checks for background characters', () => {
    const project = clone(sampleProject)

    project.characters.push({
      id: 'dock-extra',
      name: 'Dock Extra',
      importance: 'background',
      anchorTraits: [],
      goals: [],
      fears: [],
      facts: [],
      stateChanges: [],
      relationships: [],
    })

    const report = generateContinuityReport(project)

    expect(
      report.issues.find(
        (issue) =>
          issue.category === 'missing-character-core' &&
          issue.entityLabel === 'Dock Extra',
      ),
    ).toBeUndefined()
  })

  it('uses scene order instead of lexical scene id ordering for same-year state changes', () => {
    const project = clone(sampleProject)

    project.scenes = [
      {
        id: 'scene-2',
        title: 'Scene 2',
        chapter: 'Chapter 2',
        povCharacterId: 'iris',
        year: 1229,
        summary: 'The early scene should not inherit a later state change.',
        goals: ['Keep the disguise intact'],
        references: [],
        ageChecks: [],
        stateReferences: [
          {
            characterId: 'iris',
            key: 'cover-identity',
            expectedValue: 'clean',
            note: 'The disguise is still intact here.',
          },
        ],
      },
      {
        id: 'scene-10',
        title: 'Scene 10',
        chapter: 'Chapter 10',
        povCharacterId: 'iris',
        year: 1229,
        summary: 'The later scene breaks the disguise.',
        goals: ['Blow the disguise'],
        references: [],
        ageChecks: [],
        stateReferences: [],
      },
    ]

    project.characters = [
      {
        ...project.characters[0],
        anchorTraits: ['careful'],
        goals: ['stay hidden'],
        fears: ['exposure'],
        stateChanges: [
          {
            sceneId: 'scene-10',
            year: 1229,
            key: 'cover-identity',
            nextValue: 'blown',
            note: 'The disguise breaks in the later scene.',
          },
        ],
        relationships: [],
      },
    ]

    const report = generateContinuityReport(project)

    expect(
      report.issues.find(
        (issue) =>
          issue.category === 'state-conflict' && issue.sceneTitle === 'Scene 2',
      ),
    ).toBeUndefined()
  })

  it('ignores same-year state changes that cannot be placed on the known scene timeline', () => {
    const project = clone(sampleProject)

    project.scenes = [
      {
        id: 'scene-1',
        title: 'Scene 1',
        chapter: 'Chapter 1',
        povCharacterId: 'iris',
        year: 1229,
        summary: 'A known scene.',
        goals: ['Stay consistent'],
        references: [],
        ageChecks: [],
        stateReferences: [
          {
            characterId: 'iris',
            key: 'cover-identity',
            expectedValue: 'clean',
            note: 'Unknown same-year events should not override this state.',
          },
        ],
      },
    ]

    project.characters = [
      {
        ...project.characters[0],
        anchorTraits: ['careful'],
        goals: ['stay hidden'],
        fears: ['exposure'],
        stateChanges: [
          {
            sceneId: 'scene-missing',
            year: 1229,
            key: 'cover-identity',
            nextValue: 'blown',
            note: 'This change cannot be placed on the known scene timeline.',
          },
        ],
        relationships: [],
      },
    ]

    const report = generateContinuityReport(project)

    expect(
      report.issues.find(
        (issue) =>
          issue.category === 'state-conflict' && issue.sceneTitle === 'Scene 1',
      ),
    ).toBeUndefined()
  })
})
