import type { StoryProject } from '../types'

export const sampleProject: StoryProject = {
  id: 'glass-tide',
  name: 'Glass Tide',
  genre: 'Science fantasy heist saga',
  premise:
    'In a tidal city powered by stolen memory, a makeshift heist crew must reclaim a royal ledger before the harbor forgets who they are.',
  promise:
    'Keep worldbuilding, character truth, and chapter continuity inside one working canon.',
  seriesHook:
    'Each book targets a different port city where memory behaves like weather.',
  characters: [
    {
      id: 'iris',
      name: 'Iris Vale',
      archetype: 'Reluctant mastermind',
      role: 'Lead infiltrator',
      importance: 'core',
      birthYear: 1201,
      currentAge: 28,
      anchorTraits: ['precise', 'guarded', 'morally elastic'],
      goals: ['steal the archive ledger', 'erase her family debt'],
      fears: ['being remembered as a traitor', 'open water'],
      facts: [
        { key: 'home-port', label: 'Home port', value: 'Brinefall', scope: 'canon' },
        { key: 'dominant-hand', label: 'Dominant hand', value: 'left', scope: 'canon' },
        { key: 'scar', label: 'Distinctive scar', value: 'right eyebrow', scope: 'canon' },
      ],
      stateChanges: [
        {
          sceneId: 'scene-night-market',
          year: 1229,
          key: 'cover-identity',
          nextValue: 'salt broker',
          note: 'Uses the false identity that gets her past harbor customs.',
        },
        {
          sceneId: 'scene-chapel-vault',
          year: 1230,
          key: 'cover-identity',
          nextValue: 'exposed',
          note: 'The chapel wardens recognize her family crest.',
        },
      ],
      relationships: [
        {
          targetCharacterId: 'soren',
          label: 'former lover',
          reciprocalLabel: 'former lover',
          status: 'strained',
        },
        {
          targetCharacterId: 'maela',
          label: 'protector',
          reciprocalLabel: 'ward',
          status: 'stable',
        },
      ],
    },
    {
      id: 'soren',
      name: 'Soren Quill',
      archetype: 'Idealist archivist',
      role: 'Vault cartographer',
      importance: 'core',
      birthYear: 1204,
      currentAge: 26,
      anchorTraits: ['earnest', 'bookish'],
      goals: ['save the public archive', 'prove the church doctored the maps'],
      fears: ['fire', 'public betrayal'],
      facts: [
        { key: 'guild-rank', label: 'Guild rank', value: 'junior surveyor', scope: 'canon' },
        { key: 'allergy', label: 'Allergy', value: 'amber mold', scope: 'canon' },
      ],
      stateChanges: [
        {
          sceneId: 'scene-map-room',
          year: 1229,
          key: 'loyalty',
          nextValue: 'archive',
          note: 'Still tries to protect the institution from inside.',
        },
        {
          sceneId: 'scene-chapel-vault',
          year: 1230,
          key: 'loyalty',
          nextValue: 'crew',
          note: 'Chooses Iris over the archive elders.',
        },
      ],
      relationships: [
        {
          targetCharacterId: 'iris',
          label: 'former lover',
          reciprocalLabel: 'former lover',
          status: 'strained',
        },
      ],
    },
    {
      id: 'maela',
      name: 'Maela Fen',
      archetype: 'Storm-touched courier',
      role: 'Runner',
      importance: 'supporting',
      birthYear: 1214,
      currentAge: 15,
      anchorTraits: [],
      goals: ['earn enough to leave the docks'],
      fears: [],
      facts: [
        { key: 'gift', label: 'Sea-gift', value: 'hears weather in metal', scope: 'canon' },
      ],
      stateChanges: [
        {
          sceneId: 'scene-night-market',
          year: 1229,
          key: 'injury',
          nextValue: 'sprained ankle',
          note: 'Gets clipped during the opening chase.',
        },
      ],
      relationships: [
        {
          targetCharacterId: 'iris',
          label: 'ward',
          reciprocalLabel: 'protector',
          status: 'stable',
        },
      ],
    },
    {
      id: 'warden',
      name: 'Warden Thorne',
      archetype: 'Antagonist',
      role: 'Chapel security chief',
      importance: 'supporting',
      birthYear: 1193,
      currentAge: 37,
      anchorTraits: ['rigid', 'ceremonial'],
      goals: ['contain the breach', 'protect the relic vault'],
      fears: ['irrelevance'],
      facts: [
        { key: 'weapon', label: 'Signature weapon', value: 'ceramic spear', scope: 'canon' },
      ],
      stateChanges: [],
      relationships: [
        {
          targetCharacterId: 'soren',
          label: 'mentor',
          reciprocalLabel: 'student',
          status: 'stable',
        },
      ],
    },
  ],
  locations: [
    {
      id: 'brinefall',
      name: 'Brinefall',
      region: 'Tideward coast',
      anchors: ['salt markets', 'submerged bell towers'],
      risks: ['memory fog', 'tithe patrols'],
    },
    {
      id: 'chapel-vault',
      name: 'Chapel Vault',
      region: 'Old harbor',
      anchors: ['catacomb lifts', 'glass reliquaries'],
      risks: ['echo wards', 'sealed floodgates'],
    },
  ],
  rules: [
    {
      id: 'memory-tide',
      title: 'Memory Tide',
      description: 'The city sheds one public memory every new moon.',
      consequence: 'Characters who rely on records must preserve duplicates.',
    },
    {
      id: 'storm-gift',
      title: 'Storm Gifts',
      description: 'Sea-gifts intensify near forged metal and thunder.',
      consequence: 'Gifted couriers can track hidden doors but burn out fast.',
    },
  ],
  scenes: [
    {
      id: 'scene-night-market',
      title: 'Night Market Chase',
      chapter: 'Chapter 1',
      povCharacterId: 'iris',
      year: 1229,
      summary: 'Iris extracts a courier pouch while Maela twists her ankle during the escape.',
      goals: ['introduce the crew', 'plant the false identity'],
      references: [
        { entityType: 'character', entityId: 'iris', label: 'Iris Vale' },
        { entityType: 'character', entityId: 'maela', label: 'Maela Fen' },
        { entityType: 'location', entityId: 'brinefall', label: 'Brinefall' },
      ],
      ageChecks: [{ characterId: 'maela', statedAge: 16 }],
      stateReferences: [
        {
          characterId: 'maela',
          key: 'injury',
          expectedValue: 'uninjured',
          note: 'The beat sheet still describes Maela sprinting cleanly at the end.',
        },
      ],
    },
    {
      id: 'scene-map-room',
      title: 'Map Room Confession',
      chapter: 'Chapter 3',
      povCharacterId: 'soren',
      year: 1229,
      summary: 'Soren shows Iris the censored route charts and asks her to spare the apprentices.',
      goals: ['turn Soren into an ally'],
      references: [
        { entityType: 'character', entityId: 'soren', label: 'Soren Quill' },
        { entityType: 'character', entityId: 'iris', label: 'Iris Vale' },
        { entityType: 'rule', entityId: 'memory-tide', label: 'Memory Tide' },
      ],
      ageChecks: [{ characterId: 'soren', statedAge: 25 }],
      stateReferences: [
        {
          characterId: 'soren',
          key: 'loyalty',
          expectedValue: 'crew',
          note: 'A later revision pulled the emotional turn too early.',
        },
      ],
    },
    {
      id: 'scene-chapel-vault',
      title: 'Breach at the Chapel Vault',
      chapter: 'Chapter 7',
      povCharacterId: 'iris',
      year: 1230,
      summary: 'The crew reaches the reliquary only to find the vault already catalogued for burning.',
      goals: ['reveal Warden Thorne', 'force Iris to drop her alias'],
      references: [
        { entityType: 'character', entityId: 'iris', label: 'Iris Vale' },
        { entityType: 'character', entityId: 'warden', label: 'Warden Thorne' },
        { entityType: 'location', entityId: 'chapel-vault', label: 'Chapel Vault' },
        { entityType: 'character', entityId: 'unknown-smuggler', label: 'Unknown Smuggler' },
      ],
      ageChecks: [{ characterId: 'iris', statedAge: 28 }],
      stateReferences: [
        {
          characterId: 'iris',
          key: 'cover-identity',
          expectedValue: 'salt broker',
          note: 'Chapter notes forgot the alias was already blown.',
        },
      ],
    },
  ],
}
