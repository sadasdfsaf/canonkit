export type Importance = 'core' | 'supporting' | 'background'

export type FactScope = 'canon' | 'volatile'

export type Severity = 'critical' | 'high' | 'medium' | 'low'

export type EntityType = 'character' | 'location' | 'rule'

export interface CharacterFact {
  key: string
  label: string
  value: string | number
  scope: FactScope
  sourceSceneId?: string
}

export interface CharacterStateChange {
  sceneId: string
  year: number
  key: string
  nextValue: string | number
  note: string
}

export interface Relationship {
  targetCharacterId: string
  label: string
  reciprocalLabel?: string
  status: 'stable' | 'strained' | 'broken'
}

export interface Character {
  id: string
  name: string
  archetype?: string
  role?: string
  importance: Importance
  birthYear?: number
  currentAge?: number
  anchorTraits: string[]
  goals: string[]
  fears: string[]
  facts: CharacterFact[]
  stateChanges: CharacterStateChange[]
  relationships: Relationship[]
}

export interface Location {
  id: string
  name: string
  region: string
  anchors: string[]
  risks: string[]
}

export interface StoryRule {
  id: string
  title: string
  description: string
  consequence: string
}

export interface SceneReference {
  entityType: EntityType
  entityId: string
  label: string
}

export interface SceneAgeCheck {
  characterId: string
  statedAge: number
}

export interface SceneStateReference {
  characterId: string
  key: string
  expectedValue: string | number
  note: string
}

export interface Scene {
  id: string
  title: string
  chapter: string
  povCharacterId: string
  year: number
  summary: string
  goals: string[]
  references: SceneReference[]
  ageChecks: SceneAgeCheck[]
  stateReferences: SceneStateReference[]
}

export interface StoryProject {
  id: string
  name: string
  genre: string
  premise: string
  promise: string
  seriesHook: string
  characters: Character[]
  locations: Location[]
  rules: StoryRule[]
  scenes: Scene[]
}

export interface ContinuityIssue {
  id: string
  severity: Severity
  category:
    | 'missing-character-core'
    | 'age-mismatch'
    | 'missing-entity-reference'
    | 'state-conflict'
    | 'relationship-asymmetry'
  title: string
  message: string
  entityLabel: string
  sceneTitle?: string
  recommendation: string
}

export type ContinuityFinding = ContinuityIssue

export interface ContinuityReport {
  generatedAt: string
  totalScenes: number
  totalIssues: number
  criticalCount: number
  issues: ContinuityIssue[]
}
