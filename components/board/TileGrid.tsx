import { View } from 'react-native'
import Tile from './Tile'
import type { Tile as TileType } from '../../types'
import type { LanguageCode } from '../../types'

interface TileGridProps {
  tiles: TileType[]
  language: LanguageCode
  columns: number
  onTilePress: (label: string) => void
  onTilePressIn?: (tileId: string, language: LanguageCode) => void
}

// Merges tiles into a positional grid, filling empty cells with null
function buildGrid(tiles: TileType[], columns: number): (TileType | null)[][] {
  if (tiles.length === 0) return []
  const maxRow = Math.max(...tiles.map((t) => t.rowIndex))
  const rows: (TileType | null)[][] = Array.from({ length: maxRow + 1 }, () =>
    Array(columns).fill(null)
  )
  for (const tile of tiles) {
    if (tile.colIndex < columns) {
      rows[tile.rowIndex][tile.colIndex] = tile
    }
  }
  return rows
}

export default function TileGrid({ tiles, language, columns, onTilePress, onTilePressIn }: TileGridProps) {
  const size = columns <= 2 ? 'large' : 'normal'
  const grid = buildGrid(tiles, columns)

  return (
    <View className="flex-1 p-3" accessible={false}>
      {grid.map((row, rowIdx) => (
        <View
          key={rowIdx}
          className="flex-row justify-center mb-2"
          accessible={false}
        >
          {row.map((tile, colIdx) =>
            tile ? (
              <View key={tile.id} className="mx-1">
                <Tile
                  tile={tile}
                  language={language}
                  size={size}
                  onPress={onTilePress}
                  onPressIn={onTilePressIn}
                />
              </View>
            ) : (
              <View
                key={`empty-${rowIdx}-${colIdx}`}
                className="mx-1"
                style={{ width: size === 'large' ? 96 : 80, height: size === 'large' ? 96 : 80 }}
                accessible={false}
              />
            )
          )}
        </View>
      ))}
    </View>
  )
}
