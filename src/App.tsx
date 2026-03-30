import { useEffect, useRef, useState } from 'react'
import type { ChangeEvent } from 'react'

import './App.css'
import { sampleProject } from './data/sampleProject'
import {
  buildSceneOrder,
  buildTimelineState,
  generateContinuityReport,
} from './lib/continuity'
import {
  clearStoredProject,
  loadProjectFromStorage,
  parseProjectJson,
  saveProjectToStorage,
} from './lib/projectStorage'
import type { ContinuityIssue, Scene, StoryProject } from './types'

const severityRank: Record<ContinuityIssue['severity'], number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
}

const categoryCopy: Record<ContinuityIssue['category'], string> = {
  'missing-character-core': 'Character core gap',
  'age-mismatch': 'Age mismatch',
  'missing-entity-reference': 'Missing entity reference',
  'state-conflict': 'State conflict',
  'relationship-asymmetry': 'Relationship asymmetry',
}

const buildSceneContextPack = (
  storyProject: StoryProject,
  report: ReturnType<typeof generateContinuityReport>,
  scene: Scene,
) => {
  const sceneOrder = buildSceneOrder(storyProject)
  const characters = storyProject.characters.filter((character) =>
    scene.references.some(
      (reference) =>
        reference.entityType === 'character' && reference.entityId === character.id,
    ),
  )
  const locations = storyProject.locations.filter((location) =>
    scene.references.some(
      (reference) =>
        reference.entityType === 'location' && reference.entityId === location.id,
    ),
  )
  const rules = storyProject.rules.filter((rule) =>
    scene.references.some(
      (reference) => reference.entityType === 'rule' && reference.entityId === rule.id,
    ),
  )
  const issues = report.issues.filter(
    (issue) =>
      issue.sceneTitle === scene.title ||
      characters.some((character) => issue.entityLabel.includes(character.name)),
  )

  const characterNotes = characters
    .map((character) => {
      const timelineState = buildTimelineState(sceneOrder, character, scene)
      const stateEntries = Object.entries(timelineState)
        .map(([key, value]) => `${key}: ${value}`)
        .join(', ')

      return [
        `${character.name} | ${character.role ?? 'No role yet'} | ${character.archetype ?? 'No archetype yet'}`,
        `Traits: ${character.anchorTraits.join(', ') || 'Missing anchors'}`,
        `Goals: ${character.goals.join(', ') || 'Missing goals'}`,
        `Fears: ${character.fears.join(', ') || 'Missing fears'}`,
        `Live state: ${stateEntries || 'No active state changes before this scene.'}`,
      ].join('\n')
    })
    .join('\n\n')

  const worldNotes = [
    locations.map((location) => `${location.name}: ${location.anchors.join(', ')}`).join('\n'),
    rules.map((rule) => `${rule.title}: ${rule.description}`).join('\n'),
  ]
    .filter(Boolean)
    .join('\n')

  const warningBlock =
    issues.length > 0
      ? issues.map((issue) => `- ${issue.title}: ${issue.message}`).join('\n')
      : '- No continuity warnings detected for this scene.'

  return [
    `PROJECT: ${storyProject.name}`,
    `GENRE: ${storyProject.genre}`,
    `PREMISE: ${storyProject.premise}`,
    `SERIES HOOK: ${storyProject.seriesHook}`,
    '',
    `SCENE TARGET: ${scene.chapter} - ${scene.title} (${scene.year})`,
    `POV: ${storyProject.characters.find((character) => character.id === scene.povCharacterId)?.name ?? 'Unknown POV'}`,
    `SCENE SUMMARY: ${scene.summary}`,
    `SCENE GOALS: ${scene.goals.join('; ')}`,
    '',
    'CHARACTER DOSSIER:',
    characterNotes,
    '',
    'WORLD CONTEXT:',
    worldNotes || 'No extra world context selected.',
    '',
    'CONTINUITY WARNINGS:',
    warningBlock,
    '',
    'WRITING INSTRUCTION:',
    'Write the scene in a voice that preserves character motivation, existing state changes, and the established world rules. Do not invent new canon that contradicts the warnings above.',
  ].join('\n')
}

const getDownloadFilename = (storyProject: StoryProject) =>
  `${storyProject.id || 'canonkit-project'}.json`

const initialProjectState = () => {
  if (typeof window === 'undefined') {
    return { project: sampleProject, source: 'sample' as const }
  }

  return loadProjectFromStorage(window.localStorage, sampleProject)
}

function App() {
  const [initialState] = useState(initialProjectState)
  const [project, setProject] = useState(initialState.project)
  const [selectedSceneId, setSelectedSceneId] = useState(
    initialState.project.scenes[0]?.id ?? '',
  )
  const [selectedCharacterId, setSelectedCharacterId] = useState(
    initialState.project.characters[0]?.id ?? '',
  )
  const [copied, setCopied] = useState(false)
  const [workspaceNotice, setWorkspaceNotice] = useState(
    initialState.error ??
      (initialState.source === 'localStorage'
        ? 'Loaded the saved browser copy of this project.'
        : 'Loaded the bundled sample project. Changes autosave in this browser.'),
  )
  const [storageWarning, setStorageWarning] = useState<string | null>(null)
  const importInputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    const result = saveProjectToStorage(window.localStorage, project)
    setStorageWarning(result.ok ? null : result.error)
  }, [project])

  useEffect(() => {
    if (!project.scenes.some((scene) => scene.id === selectedSceneId)) {
      setSelectedSceneId(project.scenes[0]?.id ?? '')
    }
  }, [project, selectedSceneId])

  useEffect(() => {
    if (!project.characters.some((character) => character.id === selectedCharacterId)) {
      setSelectedCharacterId(project.characters[0]?.id ?? '')
    }
  }, [project, selectedCharacterId])

  const report = generateContinuityReport(project)
  const sceneOrder = buildSceneOrder(project)
  const selectedScene =
    project.scenes.find((scene) => scene.id === selectedSceneId) ?? project.scenes[0]
  const selectedCharacter =
    project.characters.find((character) => character.id === selectedCharacterId) ??
    project.characters[0]

  const selectedSceneIssues = report.issues
    .filter(
      (issue) =>
        issue.sceneTitle === selectedScene?.title ||
        (selectedCharacter ? issue.entityLabel.includes(selectedCharacter.name) : false),
    )
    .sort((left, right) => severityRank[left.severity] - severityRank[right.severity])

  const sceneContextPack = selectedScene
    ? buildSceneContextPack(project, report, selectedScene)
    : 'No scene selected.'
  const selectedCharacterState =
    selectedScene && selectedCharacter
      ? buildTimelineState(sceneOrder, selectedCharacter, selectedScene)
      : {}

  const getSceneIssueCount = (scene: Scene) =>
    report.issues.filter((issue) => issue.sceneTitle === scene.title).length

  const copyContextPack = async () => {
    try {
      await navigator.clipboard.writeText(sceneContextPack)
      setCopied(true)
      setWorkspaceNotice('Copied the current scene context pack to the clipboard.')
      window.setTimeout(() => setCopied(false), 1400)
    } catch {
      setCopied(false)
      setWorkspaceNotice('Clipboard access failed. You can still copy the pack manually.')
    }
  }

  const exportProject = () => {
    const payload = JSON.stringify(project, null, 2)
    const blob = new Blob([payload], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = getDownloadFilename(project)
    anchor.click()
    URL.revokeObjectURL(url)
    setWorkspaceNotice(`Exported ${anchor.download}.`)
  }

  const promptImport = () => {
    importInputRef.current?.click()
  }

  const handleImport = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]

    if (!file) {
      return
    }

    try {
      const raw = await file.text()
      const importedProject = parseProjectJson(raw)
      setProject(importedProject)
      setSelectedSceneId(importedProject.scenes[0]?.id ?? '')
      setSelectedCharacterId(importedProject.characters[0]?.id ?? '')
      setWorkspaceNotice(`Imported ${file.name}. This browser copy is now active.`)
    } catch (error) {
      setWorkspaceNotice(
        error instanceof Error ? error.message : 'Import failed for an unknown reason.',
      )
    } finally {
      event.target.value = ''
    }
  }

  const resetToSample = () => {
    if (typeof window !== 'undefined') {
      clearStoredProject(window.localStorage)
    }

    setProject(sampleProject)
    setSelectedSceneId(sampleProject.scenes[0]?.id ?? '')
    setSelectedCharacterId(sampleProject.characters[0]?.id ?? '')
    setWorkspaceNotice('Reset to the bundled sample project.')
  }

  return (
    <div className="app-shell">
      <header className="hero">
        <div className="hero-copy">
          <p className="eyebrow">Open-source story bible for long-form fiction</p>
          <h1>CanonKit keeps your novel&apos;s memory intact.</h1>
          <p className="hero-text">
            A local-first workspace for character canon, scene continuity, and
            LLM-ready context packs. The goal is simple: stop losing the truth of
            your story as the manuscript grows.
          </p>
          <div className="hero-actions">
            <a href="#workspace" className="primary-link">
              Explore the MVP
            </a>
            <span className="secondary-copy">
              Open-source wedge: continuity infrastructure, not commodity text
              generation.
            </span>
          </div>
          <div className="utility-row">
            <button type="button" className="toolbar-button" onClick={promptImport}>
              Import JSON
            </button>
            <button type="button" className="toolbar-button" onClick={exportProject}>
              Export JSON
            </button>
            <button type="button" className="toolbar-button ghost" onClick={resetToSample}>
              Reset sample
            </button>
            <span className="status-pill">Autosaves in this browser</span>
          </div>
          <p className="toolbar-note">{storageWarning ?? workspaceNotice}</p>
          <input
            ref={importInputRef}
            className="hidden-input"
            type="file"
            accept=".json,application/json"
            onChange={handleImport}
          />
        </div>

        <div className="hero-metrics">
          <article className="metric-card">
            <span className="metric-label">Tracked canon entities</span>
            <strong>
              {project.characters.length + project.locations.length + project.rules.length}
            </strong>
            <p>Characters, locations, and hard story rules in one source of truth.</p>
          </article>
          <article className="metric-card">
            <span className="metric-label">Continuity findings</span>
            <strong>{report.totalIssues}</strong>
            <p>
              {report.criticalCount} critical issue(s) surfaced before drafting
              goes off course.
            </p>
          </article>
          <article className="metric-card">
            <span className="metric-label">Current project ID</span>
            <strong>{project.id}</strong>
            <p>Exportable JSON project data with browser persistence by default.</p>
          </article>
        </div>
      </header>

      <main className="workspace" id="workspace">
        <section className="workspace-grid">
          <article className="panel panel-story">
            <div className="panel-header">
              <div>
                <p className="panel-kicker">Project snapshot</p>
                <h2>{project.name}</h2>
              </div>
              <span className="genre-pill">{project.genre}</span>
            </div>
            <p className="lead-copy">{project.premise}</p>
            <div className="summary-grid">
              <div>
                <h3>Reader promise</h3>
                <p>{project.promise}</p>
              </div>
              <div>
                <h3>Series hook</h3>
                <p>{project.seriesHook}</p>
              </div>
            </div>
            <div className="chip-row">
              {project.rules.map((rule) => (
                <span className="rule-chip" key={rule.id}>
                  {rule.title}
                </span>
              ))}
            </div>
          </article>

          <article className="panel panel-market">
            <div className="panel-header">
              <div>
                <p className="panel-kicker">Why this can win</p>
                <h2>Product thesis</h2>
              </div>
            </div>
            <div className="thesis-list">
              <div>
                <h3>Open-source wedge</h3>
                <p>
                  Most open-source writing apps stop at editor plus outline.
                  CanonKit moves into continuity infrastructure and scene packaging.
                </p>
              </div>
              <div>
                <h3>Commercial follow-up</h3>
                <p>
                  Hosted sync, team review, import pipelines, and deeper
                  model-based analysis fit naturally on top of the local core.
                </p>
              </div>
              <div>
                <h3>Who benefits first</h3>
                <p>
                  Indie authors, web novel teams, and AI-assisted writers who need
                  canon discipline more than raw generation.
                </p>
              </div>
            </div>
          </article>

          <article className="panel panel-characters">
            <div className="panel-header">
              <div>
                <p className="panel-kicker">Story bible</p>
                <h2>Characters</h2>
              </div>
            </div>
            <div className="selector-row">
              {project.characters.map((character) => (
                <button
                  key={character.id}
                  className={
                    selectedCharacter && character.id === selectedCharacter.id
                      ? 'selector-button active'
                      : 'selector-button'
                  }
                  onClick={() => setSelectedCharacterId(character.id)}
                  type="button"
                >
                  <span>{character.name}</span>
                  <small>{character.role ?? 'Needs role'}</small>
                </button>
              ))}
            </div>

            {selectedCharacter ? (
              <div className="detail-block">
                <div className="detail-heading">
                  <div>
                    <h3>{selectedCharacter.name}</h3>
                    <p>
                      {selectedCharacter.archetype ?? 'Archetype missing'} |{' '}
                      {selectedCharacter.role ?? 'Role missing'}
                    </p>
                  </div>
                  <span className="importance-pill">{selectedCharacter.importance}</span>
                </div>

                <div className="detail-grid">
                  <div>
                    <h4>Anchors</h4>
                    <p>{selectedCharacter.anchorTraits.join(', ') || 'No anchor traits yet.'}</p>
                  </div>
                  <div>
                    <h4>Goals</h4>
                    <p>{selectedCharacter.goals.join(', ') || 'No goals yet.'}</p>
                  </div>
                  <div>
                    <h4>Fears</h4>
                    <p>{selectedCharacter.fears.join(', ') || 'No fears yet.'}</p>
                  </div>
                  <div>
                    <h4>Current state at scene</h4>
                    <p>
                      {Object.entries(selectedCharacterState)
                        .map(([key, value]) => `${key}: ${value}`)
                        .join(', ') || 'No state transitions active yet.'}
                    </p>
                  </div>
                </div>

                <div className="fact-list">
                  <div>
                    <h4>Canon facts</h4>
                    <ul>
                      {selectedCharacter.facts.map((fact) => (
                        <li key={fact.key}>
                          <span>{fact.label}</span>
                          <strong>{fact.value}</strong>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4>Relationships</h4>
                    <ul>
                      {selectedCharacter.relationships.map((relationship) => (
                        <li key={`${relationship.targetCharacterId}-${relationship.label}`}>
                          <span>{relationship.label}</span>
                          <strong>
                            {project.characters.find(
                              (character) =>
                                character.id === relationship.targetCharacterId,
                            )?.name ?? relationship.targetCharacterId}
                          </strong>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ) : null}
          </article>

          <article className="panel panel-scenes">
            <div className="panel-header">
              <div>
                <p className="panel-kicker">Scene rail</p>
                <h2>Draft flow</h2>
              </div>
            </div>
            <div className="scene-list">
              {project.scenes.map((scene) => (
                <button
                  key={scene.id}
                  className={selectedScene && scene.id === selectedScene.id ? 'scene-card active' : 'scene-card'}
                  onClick={() => setSelectedSceneId(scene.id)}
                  type="button"
                >
                  <div>
                    <span className="scene-chapter">{scene.chapter}</span>
                    <h3>{scene.title}</h3>
                  </div>
                  <span className="issue-pill">{getSceneIssueCount(scene)} issue(s)</span>
                </button>
              ))}
            </div>
            {selectedScene ? (
              <div className="selected-scene">
                <div className="detail-heading">
                  <div>
                    <h3>{selectedScene.title}</h3>
                    <p>
                      {selectedScene.chapter} | {selectedScene.year}
                    </p>
                  </div>
                  <span className="importance-pill">
                    POV:{' '}
                    {project.characters.find(
                      (character) => character.id === selectedScene.povCharacterId,
                    )?.name ?? 'Unknown'}
                  </span>
                </div>
                <p className="scene-summary">{selectedScene.summary}</p>
                <div className="detail-grid">
                  <div>
                    <h4>Scene goals</h4>
                    <p>{selectedScene.goals.join(', ')}</p>
                  </div>
                  <div>
                    <h4>Referenced entities</h4>
                    <p>
                      {selectedScene.references.map((reference) => reference.label).join(', ')}
                    </p>
                  </div>
                </div>
              </div>
            ) : null}
          </article>

          <article className="panel panel-report">
            <div className="panel-header">
              <div>
                <p className="panel-kicker">Continuity scanner</p>
                <h2>Findings</h2>
              </div>
              <span className="critical-badge">{report.criticalCount} critical</span>
            </div>

            <div className="report-summary">
              <div>
                <strong>{report.totalIssues}</strong>
                <span>Total findings</span>
              </div>
              <div>
                <strong>{report.totalScenes}</strong>
                <span>Scenes scanned</span>
              </div>
            </div>

            <div className="finding-list">
              {selectedSceneIssues.map((issue) => (
                <article className="finding-card" key={issue.id}>
                  <div className="finding-topline">
                    <span className={`severity-pill severity-${issue.severity}`}>
                      {issue.severity}
                    </span>
                    <span className="finding-category">{categoryCopy[issue.category]}</span>
                  </div>
                  <h3>{issue.title}</h3>
                  <p>{issue.message}</p>
                  <small>{issue.recommendation}</small>
                </article>
              ))}
            </div>
          </article>

          <article className="panel panel-pack">
            <div className="panel-header">
              <div>
                <p className="panel-kicker">LLM handoff</p>
                <h2>Scene context pack</h2>
              </div>
              <button className="copy-button" onClick={copyContextPack} type="button">
                {copied ? 'Copied' : 'Copy pack'}
              </button>
            </div>
            <p className="pack-note">
              This is the monetizable seam: keep canon structured locally, then
              hand a precise brief to any model or hosted agent.
            </p>
            <pre>{sceneContextPack}</pre>
          </article>
        </section>
      </main>
    </div>
  )
}

export default App
