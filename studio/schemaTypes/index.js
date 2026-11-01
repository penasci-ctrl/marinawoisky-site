import { localeString, localeText, localeBlock, altImage } from './locale'
import { artwork } from './artwork'
import { exhibition } from './exhibition'
import { publication } from './publication'
import { text } from './text'
import { about } from './about'
import { settings } from './settings'

export const SINGLETONS = ['about', 'settings']

export const schemaTypes = [localeString, localeText, localeBlock, altImage, artwork, exhibition, publication, text, about, settings]
