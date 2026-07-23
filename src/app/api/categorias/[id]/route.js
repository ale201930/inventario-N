import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    
    // Dissociate category from existing products
    await query('UPDATE productos SET categoria_id = NULL WHERE categoria_id = ?', [Number(id)]);
    
    // Delete category row
    await query('DELETE FROM categorias WHERE id = ?', [Number(id)]);

    return NextResponse.json({ success: true, message: 'Categoría eliminada con éxito' });
  } catch (err) {
    return NextResponse.json({ error: 'Error al eliminar categoría: ' + err.message }, { status: 500 });
  }
}
