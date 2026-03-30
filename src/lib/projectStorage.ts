import type {
  Character,
  CharacterFact,
  CharacterStateChange,
  Importance,
  Location,
  Relationship,
  Scene,
  SceneAgeCheck,
  SceneReference,
  SceneStateReference,
  StoryProject,
  StoryRule,
} from '../types'

export const CANONKIT_PROJECT_STORAGE_KEY = 'canonkit.active-project'

type StorageReader = Pick<Storage, 'getItem'>
type StorageWriter = Pick<Storage, 'removeItem' | 'setItem'>

type LoadResult = {
  project: StoryProject
  source: 'sample' | 'localStorage'
  error?: string
}

const importanceValues: Importance[] = ['core', 'supporting', 'background']
const entityTypeValues = ['character', 'location', 'rule'] as const
const relationshipStatusValues = ['stable', 'strained', 'broken'] as const

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const isString = (value: unknown): value is string => typeof value === 'string'

const isNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value)

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every(isString)

const isImportance = (value: unknown): value is Importance =>
  isString(value) && importanceValues.includes(value as Importance)

const isCharacterFact = (value: unknown): value is CharacterFact =>
  isRecord(value) &&
  isString(value.key) &&
  isString(value.label) &&
  (isString(value.value) || isNumber(value.value)) &&
  (value.scope === 'canon' || value.scope === 'volatile') &&
  (value.sourceSceneId === undefined || isString(value.sourceSceneId))

const isCharacterStateChange = (value: unknown): value is CharacterStateChange =>
  isRecord(value) &&
  isString(value.sceneId) &&
  isNumber(value.year) &&
  isString(value.key) &&
  (isString(value.nextValue) || isNumber(value.nextValue)) &&
  isString(value.note)

const isRelationship = (value: unknown): value is Relationship =>
  isRecord(value) &&
  isString(value.targetCharacterId) &&
  isString(value.label) &&
  (value.reciprocalLabel === undefined || isString(value.reciprocalLabel)) &&
  isString(value.status) &&
  relationshipStatusValues.includes(value.status as (typeof relationshipStatusValues)[number])

const isCharacter = (value: unknown): value is Character =>
  isRecord(value) &&
  isString(value.id) &&
  isString(value.name) &&
  (value.archetype === undefined || isString(value.archetype)) &&
  (value.role === undefined || isString(value.role)) &&
  isImportance(value.importance) &&
  (value.birthYear === undefined || isNumber(value.birthYear)) &&
  (value.currentAge === undefined || isNumber(value.currentAge)) &&
  isStringArray(value.anchorTraits) &&
  isStringArray(value.goals) &&
  isStringArray(value.fears) &&
  Array.isArray(value.facts) &&
  value.facts.every(isCharacterFact) &&
  Array.isArray(value.stateChanges) &&
  value.stateChanges.every(isCharacterStateChange) &&
  Array.isArray(value.relationships) &&
  value.relationships.every(isRelationship)

const isLocation = (value: unknown): value is Location =>
  isRecord(value) &&
  isString(value.id) &&
  isString(value.name) &&
  isString(value.region) &&
  isStringArray(value.anchors) &&
  isStringArray(value.risks)

const isStoryRule = (value: unknown): value is StoryRule =>
  isRecord(value) &&
  isString(value.id) &&
  isString(value.title) &&
  isString(value.description) &&
  isString(value.consequence)

const isSceneReference = (value: unknown): value is SceneReference =>
  isRecord(value) &&
  isString(value.entityId) &&
  isString(value.label) &&
  isString(value.entityType) &&
  entityTypeValues.includes(value.entityType as (typeof entityTypeValues)[number])

const isSceneAgeCheck = (value: unknown): value is SceneAgeCheck =>
  isRecord(value) && isString(value.characterId) && isNumber(value.statedAge)

const isSceneStateReference = (value: unknown): value is SceneStateReference =>
  isRecord(value) &&
  isString(value.characterId) &&
  isString(value.key) &&
  (isString(value.expectedValue) || isNumber(value.expectedValue)) &&
  isString(value.note)

const isScene = (value: unknown): value is Scene =>
  isRecord(value) &&
  isString(value.id) &&
  isString(value.title) &&
  isString(value.chapter) &&
  isString(value.povCharacterId) &&
  isNumber(value.year) &&
  isString(value.summary) &&
  isStringArray(value.goals) &&
  Array.isArray(value.references) &&
  value.references.every(isSceneReference) &&
  Array.isArray(value.ageChecks) &&
  value.ageChecks.every(isSceneAgeCheck) &&
  Array.isArray(value.stateReferences) &&
  value.stateReferences.every(isSceneStateReference)

export const isStoryProject = (value: unknown): value is StoryProject =>
  isRecord(value) &&
  isString(value.id) &&
  isString(value.name) &&
  isString(value.genre) &&
  isString(value.premise) &&
  isString(value.promise) &&
  isString(value.seriesHook) &&
  Array.isArray(value.characters) &&
  value.characters.every(isCharacter) &&
  Array.isArray(value.locations) &&
  value.locations.every(isLocation) &&
  Array.isArray(value.rules) &&
  value.rules.every(isStoryRule) &&
  Array.isArray(value.scenes) &&
  value.scenes.every(isScene)

export const parseProjectJson = (raw: string): StoryProject => {
  let parsed: unknown

  try {
    parsed = JSON.parse(raw)
  } catch {
    throw new Error('Import failed: the selected file is not valid JSON.')
  }

  if (!isStoryProject(parsed)) {
    throw new Error(
      'Import failed: the JSON does not match the CanonKit story project format.',
    )
  }

  return parsed
}

export const loadProjectFromStorage = (
  storage: StorageReader,
  fallbackProject: StoryProject,
): LoadResult => {
  const raw = storage.getItem(CANONKIT_PROJECT_STORAGE_KEY)

  if (!raw) {
    return { project: fallbackProject, source: 'sample' }
  }

  try {
    return {
      project: parseProjectJson(raw),
      source: 'localStorage',
    }
  } catch (error) {
    return {
      project: fallbackProject,
      source: 'sample',
      error:
        error instanceof Error
          ? `${error.message} Reverted to the bundled sample project.`
          : 'Saved browser data could not be loaded. Reverted to the bundled sample project.',
    }
  }
}

export const saveProjectToStorage = (
  storage: StorageWriter,
  project: StoryProject,
): { ok: true } | { ok: false; error: string } => {
  try {
    storage.setItem(CANONKIT_PROJECT_STORAGE_KEY, JSON.stringify(project))
    return { ok: true }
  } catch {
    return {
      ok: false,
      error:
        'Autosave failed in this browser. You can still export the project as JSON manually.',
    }
  }
}

export const clearStoredProject = (storage: StorageWriter) => {
  storage.removeItem(CANONKIT_PROJECT_STORAGE_KEY)
}
