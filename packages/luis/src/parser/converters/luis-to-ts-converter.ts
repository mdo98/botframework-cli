import {ParseMultiPlatformLuis} from '../luisfile/parse-multi-platform-luis'

import {Writer} from './helpers/writer'

import Composite = ParseMultiPlatformLuis.Composite
import MultiPlatformLuis = ParseMultiPlatformLuis.MultiPlatformLuis

export namespace LuisToTsConverter {
  export async function writeFromLuisJson(
    luisJson: any,
    description: string,
    className: string,
    outPath: string
  ) {
    const app: MultiPlatformLuis = ParseMultiPlatformLuis.fromLuisApp(luisJson)
    let writer = new Writer()
    writer.indentSize = 2
    await writer.setOutputStream(outPath)
    header(description, writer)
    intents(app, writer)
    entities(app, writer)
    classInterface(className, writer)
  }

  function header(
    description: string,
    writer: Writer
  ): void {
    writer.writeLine([
      '/**',
      ' * <auto-generated>',
      ` * Code generated by ${description}`,
      ' * Tool github: https://github.com/microsoft/botbuilder-tools',
      ' * Changes may cause incorrect behavior and will be lost if the code is',
      ' * regenerated.',
      ' * </auto-generated>',
      ' */',
      "import {DateTimeSpec, GeographyV2, IntentData, InstanceData, NumberWithUnits, OrdinalV2} from 'botbuilder-ai'"
    ])
  }

  function intents(app: MultiPlatformLuis, writer: Writer): void {
    writer.writeLine()
    writer.writeLineIndented('export interface GeneratedIntents {')
    writer.increaseIndentation()
    app.intents.forEach((intent: string) => {
      writer.writeLineIndented(`${ParseMultiPlatformLuis.normalizeName(intent)}: IntentData`)
    })
    writer.decreaseIndentation()
    writer.writeLine('}')
  }

  function entities(app: MultiPlatformLuis, writer: Writer): void {
    // Composite instance and data
    app.composites.forEach((composite: Composite) => {
      let name = ParseMultiPlatformLuis.normalizeName(composite.compositeName)
      writer.writeLine()
      writer.writeLineIndented(`export interface GeneratedInstance${name} {`)
      writer.increaseIndentation()
      composite.attributes.forEach((attribute: any) => {
        writer.writeLineIndented(
          `${ParseMultiPlatformLuis.jsonPropertyName(attribute)}?: InstanceData[]`
        )
      })
      writer.decreaseIndentation()
      writer.writeLineIndented('}')
      writer.writeLineIndented(`export interface ${name} {`)
      writer.increaseIndentation()
      composite.attributes.forEach(attribute => {
        writer.writeLineIndented(getEntityWithType(
          attribute,
          isList(attribute, app)
        ))
      })
      writer.writeLineIndented(`$instance?: GeneratedInstance${name}`)
      writer.decreaseIndentation()
      writer.writeLineIndented('}')
    })
    writer.writeLine()

    // Entity instance
    writer.writeLineIndented('export interface GeneratedInstance {')
    writer.increaseIndentation()
    app.getInstancesList().forEach(instance => {
      writer.writeLineIndented(
        `${ParseMultiPlatformLuis.jsonPropertyName(instance)}?: InstanceData[]`
        )
    })
    writer.decreaseIndentation()
    writer.writeLineIndented('}')

    // Entities
    writer.writeLine()
    writer.writeLineIndented('export interface GeneratedEntities {')
    writer.increaseIndentation()

    writeEntityGroup(app.simpleEntities, '// Simple entities', writer)

    writer.writeLineIndented('// Built-in entities')
    app.builtInEntities.forEach(builtInEntity => {
      builtInEntity.forEach(entity => {
        writer.writeLineIndented(
          getEntityWithType(entity)
        )
      })
    })
    writer.writeLine()

    writeEntityGroup(app.listEntities, '// Lists', writer, true)
    writeEntityGroup(app.regexEntities, '// Regex entities', writer)
    writeEntityGroup(app.patternEntities, '// Pattern.any', writer)

    // Composites
    writer.writeLineIndented('// Composites')
    app.composites.forEach(composite => {
      writer.writeLineIndented(
        `${composite.compositeName}?: ${composite.compositeName}[]`
        )
    })
    writer.writeLineIndented('$instance: GeneratedInstance')
    writer.decreaseIndentation()
    writer.writeLineIndented('}')
  }

  function classInterface(className: string, writer: Writer): void {
    writer.writeLine()
    writer.writeLineIndented(`export interface ${className} {`)
    writer.increaseIndentation()
    writer.writeLineIndented([
      'text: string',
      'alteredText?: string',
      'intents: GeneratedIntents',
      'entities: GeneratedEntities',
      '[propName: string]: any'
    ])
    writer.decreaseIndentation()
    writer.writeLineIndented('}')
  }

  function writeEntityGroup(entityGroup: string[], description: string, writer: Writer, isListType = false) {
    writer.writeLineIndented(description)
    entityGroup.forEach(entity => {
      writer.writeLineIndented(
        getEntityWithType(entity, isListType)
      )
    })
    writer.writeLine()
  }

  function isList(entityName: string, app: MultiPlatformLuis): boolean {
    return app.listEntities.includes(entityName)
  }

  function getEntityWithType(entityName: string, isListType = false): string {
    let result = ''

    switch (isListType ? 'list' : entityName) {
    case 'age':
    case 'dimension':
    case 'money':
    case 'temperature':
      result = '?: NumberWithUnits[]'
      break
    case 'geographyV2':
      result = '?: GeographyV2[]'
      break
    case 'ordinalV2':
      result = '?: OrdinalV2[]'
      break
    case 'number':
    case 'ordinal':
    case 'percentage':
      result = '?: number[]'
      break
    case 'datetimeV2':
      result = '?: DateTimeSpec[]'
      break
    case 'list':
      result = '?: string[][]'
      break
    default:
      result = '?: string[]'
    }

    return ParseMultiPlatformLuis.jsonPropertyName(entityName) + result
  }
}
