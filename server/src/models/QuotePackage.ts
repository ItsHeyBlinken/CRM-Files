import { getPool } from '../config/database'

export interface IQuotePackageLineItem {
  id: number
  packageId: number
  description: string
  quantity: number
  unitPrice: number
  sortOrder: number
}

export interface IQuotePackage {
  id: number
  vendorId: number
  name: string
  description: string | null
  createdAt: Date
  updatedAt: Date
  lineItems: IQuotePackageLineItem[]
}

export interface IQuotePackageCreate {
  name: string
  description?: string | null
  lineItems: Array<{ description: string; quantity: number; unitPrice: number }>
}

export interface IQuotePackageUpdate {
  name?: string
  description?: string | null
  lineItems?: Array<{ description: string; quantity: number; unitPrice: number }>
}

function mapLineItem(row: {
  id: number
  package_id: number
  description: string
  quantity: string | number
  unit_price: string | number
  sort_order: number
}): IQuotePackageLineItem {
  return {
    id: row.id,
    packageId: row.package_id,
    description: row.description,
    quantity: Number(row.quantity),
    unitPrice: Number(row.unit_price),
    sortOrder: row.sort_order,
  }
}

function mapPackage(
  row: {
    id: number
    vendor_id: number
    name: string
    description: string | null
    created_at: Date
    updated_at: Date
  },
  lineItems: IQuotePackageLineItem[]
): IQuotePackage {
  return {
    id: row.id,
    vendorId: row.vendor_id,
    name: row.name,
    description: row.description,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    lineItems,
  }
}

async function loadLineItems(packageId: number): Promise<IQuotePackageLineItem[]> {
  const pool = getPool()
  const result = await pool.query(
    `
    SELECT id, package_id, description, quantity, unit_price, sort_order
    FROM quote_package_line_items
    WHERE package_id = $1
    ORDER BY sort_order ASC, id ASC
    `,
    [packageId]
  )
  return result.rows.map(mapLineItem)
}

class QuotePackageModel {
  static async findByVendorId(vendorId: number): Promise<IQuotePackage[]> {
    const pool = getPool()
    const result = await pool.query(
      `
      SELECT * FROM quote_packages
      WHERE vendor_id = $1
      ORDER BY name ASC
      `,
      [vendorId]
    )
    const packages: IQuotePackage[] = []
    for (const row of result.rows) {
      const lineItems = await loadLineItems(row.id)
      packages.push(mapPackage(row, lineItems))
    }
    return packages
  }

  static async findByIdForVendor(
    id: number,
    vendorId: number
  ): Promise<IQuotePackage | null> {
    const pool = getPool()
    const result = await pool.query(
      `SELECT * FROM quote_packages WHERE id = $1 AND vendor_id = $2`,
      [id, vendorId]
    )
    if (result.rows.length === 0) {
      return null
    }
    const lineItems = await loadLineItems(id)
    return mapPackage(result.rows[0], lineItems)
  }

  static async create(vendorId: number, data: IQuotePackageCreate): Promise<IQuotePackage> {
    if (!data.name?.trim()) {
      throw new Error('NAME_REQUIRED')
    }
    if (!Array.isArray(data.lineItems) || data.lineItems.length === 0) {
      throw new Error('LINE_ITEMS_REQUIRED')
    }

    const pool = getPool()
    const client = await pool.connect()
    try {
      await client.query('BEGIN')
      const pkgResult = await client.query(
        `
        INSERT INTO quote_packages (vendor_id, name, description)
        VALUES ($1, $2, $3)
        RETURNING *
        `,
        [vendorId, data.name.trim(), data.description?.trim() || null]
      )
      const pkg = pkgResult.rows[0]
      for (let i = 0; i < data.lineItems.length; i++) {
        const item = data.lineItems[i]
        if (!item) continue
        await client.query(
          `
          INSERT INTO quote_package_line_items (
            package_id, description, quantity, unit_price, sort_order
          ) VALUES ($1, $2, $3, $4, $5)
          `,
          [
            pkg.id,
            item.description.trim(),
            item.quantity,
            item.unitPrice,
            i,
          ]
        )
      }
      await client.query('COMMIT')
      const lineItems = await loadLineItems(pkg.id)
      return mapPackage(pkg, lineItems)
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    } finally {
      client.release()
    }
  }

  static async update(
    id: number,
    vendorId: number,
    data: IQuotePackageUpdate
  ): Promise<IQuotePackage | null> {
    const existing = await this.findByIdForVendor(id, vendorId)
    if (!existing) {
      return null
    }

    const pool = getPool()
    const client = await pool.connect()
    try {
      await client.query('BEGIN')
      await client.query(
        `
        UPDATE quote_packages SET
          name = COALESCE($3, name),
          description = CASE WHEN $4::boolean THEN $5 ELSE description END,
          updated_at = NOW()
        WHERE id = $1 AND vendor_id = $2
        `,
        [
          id,
          vendorId,
          data.name?.trim() ?? null,
          data.description !== undefined,
          data.description === undefined ? null : data.description?.trim() || null,
        ]
      )

      if (data.lineItems) {
        if (data.lineItems.length === 0) {
          throw new Error('LINE_ITEMS_REQUIRED')
        }
        await client.query(`DELETE FROM quote_package_line_items WHERE package_id = $1`, [id])
        for (let i = 0; i < data.lineItems.length; i++) {
          const item = data.lineItems[i]
          if (!item) continue
          await client.query(
            `
            INSERT INTO quote_package_line_items (
              package_id, description, quantity, unit_price, sort_order
            ) VALUES ($1, $2, $3, $4, $5)
            `,
            [id, item.description.trim(), item.quantity, item.unitPrice, i]
          )
        }
      }

      await client.query('COMMIT')
      return this.findByIdForVendor(id, vendorId)
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    } finally {
      client.release()
    }
  }

  static async deleteForVendor(id: number, vendorId: number): Promise<boolean> {
    const pool = getPool()
    const result = await pool.query(
      `DELETE FROM quote_packages WHERE id = $1 AND vendor_id = $2`,
      [id, vendorId]
    )
    return (result.rowCount ?? 0) > 0
  }
}

export const QuotePackage = QuotePackageModel
