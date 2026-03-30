import type {
  Character,
  ContinuityIssue,
  ContinuityReport,
  Relationship,
  Scene,
  StoryProject,
} from '../types'

type IssueDraft = Omit<ContinuityIssue, 'id'>

const coreCharacterFields: Array<{ key: keyof Character; label: string }> = [
  { key: 'role', label: 'role' },
  { key: 'archetype', label: 'archetype' },
]

const inverseRelationshipMap: Record<string, string> = {
  mentor: 'student',
  student: 'mentor',
  protector: 'ward',
  ward: 'protector',
  former_love: 'former_love',
  former_lover: 'former_lover',
  sibling: 'sibling',
  rival: 'rival',
}

const normalizeRelationship = (value: string) =>
  value.toLowerCase().trim().replaceAll(' ', '_')

const makeIssue = (issue: IssueDraft, index: number): ContinuityIssue => ({
  id: `issue-${index + 1}`,
  ...issue,
})

const checkMissingCharacterCore = (project: StoryProject): IssueDraft[] =>
  project.characters
    .filter((character) => character.importance !== 'background')
    .flatMap((character) => {
      const missing = coreCharacterFields
        .filter(({ key }) => !character[key])
        .map(({ label }) => label)

      if (character.anchorTraits.length === 0) {
        missing.push('anchor traits')
      }

      if (character.goals.length === 0) {
        missing.push('goals')
      }

      if (character.fears.length === 0) {
        missing.push('fears')
      }

      if (missing.length === 0) {
        return []
      }

      return [
        {
          severity: character.importance === 'core' ? 'high' : 'medium',
          category: 'missing-character-core',
          title: `${character.name} is missing essential canon fields`,
          message: `Missing: ${missing.join(', ')}.`,
          entityLabel: character.name,
          recommendation:
            'Fill in the missing archetype, motivations, fears, and anchor traits before expanding this character into later scenes.',
        },
      ]
    })

const buildCharacterMap = (project: StoryProject) =>
  new Map(project.characters.map((character) => [character.id, character]))

export const buildSceneOrder = (project: StoryProject) =>
  new Map(project.scenes.map((scene, index) => [scene.id, index]))

export const buildTimelineState = (
  sceneOrder: Map<string, number>,
  character: Character,
  scene: Scene,
) => {
  const currentSceneIndex = sceneOrder.get(scene.id)

  return character.stateChanges
    .filter((change) => {
      if (change.year < scene.year) {
        return true
      }

      if (change.year > scene.year) {
        return false
      }

      const changeSceneIndex = sceneOrder.get(change.sceneId)

      // If we cannot place a same-year state change on the scene timeline,
      // do not let it override a known scene state and create false positives.
      return (
        changeSceneIndex !== undefined &&
        currentSceneIndex !== undefined &&
        changeSceneIndex <= currentSceneIndex
      )
    })
    .sort((a, b) => {
      if (a.year !== b.year) {
        return a.year - b.year
      }

      const leftIndex = sceneOrder.get(a.sceneId)
      const rightIndex = sceneOrder.get(b.sceneId)

      if (leftIndex === undefined && rightIndex === undefined) {
        return 0
      }

      if (leftIndex === undefined) {
        return 1
      }

      if (rightIndex === undefined) {
        return -1
      }

      return leftIndex - rightIndex
    })
    .reduce<Record<string, string | number>>((state, change) => {
      state[change.key] = change.nextValue
      return state
    }, {})
}

const checkAgeMismatch = (project: StoryProject): IssueDraft[] => {
  const characterMap = buildCharacterMap(project)

  return project.scenes.flatMap((scene) =>
    scene.ageChecks.flatMap((ageCheck) => {
      const character = characterMap.get(ageCheck.characterId)

      if (!character || character.birthYear === undefined) {
        return []
      }

      const expectedAge = scene.year - character.birthYear
      if (expectedAge === ageCheck.statedAge) {
        return []
      }

      return [
        {
          severity: 'high',
          category: 'age-mismatch',
          title: `${character.name} has an age mismatch`,
          message: `Scene says ${ageCheck.statedAge}, but birth year ${character.birthYear} makes ${character.name} ${expectedAge} in ${scene.year}.`,
          entityLabel: character.name,
          sceneTitle: scene.title,
          recommendation:
            'Normalize birth year, scene year, and dialogue references so the timeline reads consistently.',
        },
      ]
    }),
  )
}

const checkMissingEntityReferences = (project: StoryProject): IssueDraft[] => {
  const entityIndex = {
    character: new Set(project.characters.map((character) => character.id)),
    location: new Set(project.locations.map((location) => location.id)),
    rule: new Set(project.rules.map((rule) => rule.id)),
  }

  return project.scenes.flatMap((scene) =>
    scene.references.flatMap((reference) => {
      if (entityIndex[reference.entityType].has(reference.entityId)) {
        return []
      }

      const entityLabel =
        reference.entityType === 'character'
          ? 'character'
          : reference.entityType === 'location'
            ? 'location'
            : 'rule'

      return [
        {
          severity: 'critical',
          category: 'missing-entity-reference',
          title: `Scene references a missing ${entityLabel}`,
          message: `${scene.title} references "${reference.label}", but there is no matching ${entityLabel} record in the project.`,
          entityLabel: reference.label,
          sceneTitle: scene.title,
          recommendation: 'Create the missing entity card or correct the referenced ID before drafting from this scene plan.',
        },
      ]
    }),
  )
}

const checkStateConflicts = (project: StoryProject): IssueDraft[] => {
  const characterMap = buildCharacterMap(project)
  const sceneOrder = buildSceneOrder(project)

  return project.scenes.flatMap((scene) =>
    scene.stateReferences.flatMap((reference) => {
      const character = characterMap.get(reference.characterId)
      if (!character) {
        return []
      }

      const timelineState = buildTimelineState(sceneOrder, character, scene)
      const actualValue = timelineState[reference.key]

      if (actualValue === undefined || actualValue === reference.expectedValue) {
        return []
      }

      return [
        {
          severity: 'high',
          category: 'state-conflict',
          title: `${character.name} conflicts with the current timeline state`,
          message: `${scene.title} expects ${reference.key} to be "${reference.expectedValue}", but the timeline already sets it to "${actualValue}".`,
          entityLabel: character.name,
          sceneTitle: scene.title,
          recommendation: `Rewrite the scene beat or move the state change later. Note: ${reference.note}`,
        },
      ]
    }),
  )
}

const hasReciprocalRelationship = (
  source: Character,
  target: Character,
  relationship: Relationship,
) => {
  const expected = normalizeRelationship(
    relationship.reciprocalLabel ??
      inverseRelationshipMap[normalizeRelationship(relationship.label)] ??
      relationship.label,
  )

  return target.relationships.some(
    (candidate) =>
      candidate.targetCharacterId === source.id &&
      normalizeRelationship(candidate.label) === expected,
  )
}

const checkRelationshipAsymmetry = (project: StoryProject): IssueDraft[] => {
  const characterMap = buildCharacterMap(project)
  const issues: IssueDraft[] = []

  for (const character of project.characters) {
    for (const relationship of character.relationships) {
      const target = characterMap.get(relationship.targetCharacterId)
      if (!target) {
        issues.push({
          severity: 'high',
          category: 'relationship-asymmetry',
          title: `${character.name} points to a missing relationship target`,
          message: `${character.name} records a relationship with ${relationship.targetCharacterId}, but that character does not exist in the project.`,
          entityLabel: character.name,
          recommendation: 'Remove the stale relationship or add the missing target character card.',
        })
        continue
      }

      if (hasReciprocalRelationship(character, target, relationship)) {
        continue
      }

      issues.push({
        severity: 'medium',
        category: 'relationship-asymmetry',
        title: `${character.name} and ${target.name} are not mirrored`,
        message: `${character.name} lists "${relationship.label}", but ${target.name} does not have the expected reciprocal relationship.`,
        entityLabel: `${character.name} / ${target.name}`,
        recommendation:
          'Sync both relationship cards so editors, collaborators, and models read the same canon from either side.',
      })
    }
  }

  return issues
}

export const generateContinuityReport = (project: StoryProject): ContinuityReport => {
  const issues = [
    ...checkMissingCharacterCore(project),
    ...checkAgeMismatch(project),
    ...checkMissingEntityReferences(project),
    ...checkStateConflicts(project),
    ...checkRelationshipAsymmetry(project),
  ].map((issue, index) => makeIssue(issue, index))

  return {
    generatedAt: new Date().toISOString(),
    totalScenes: project.scenes.length,
    totalIssues: issues.length,
    criticalCount: issues.filter((issue) => issue.severity === 'critical').length,
    issues,
  }
}
