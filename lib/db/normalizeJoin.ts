export function normalizeJoinedChild<T extends Record<string, any>>(row: T): T {
    if (!row) return row

    const copy: any = { ...row }

    // normalize top-level child
    if (copy.child) {
        copy.child = Array.isArray(copy.child) ? copy.child[0] : copy.child
    }

    // fallback to appointment.child
    if (!copy.child && copy.appointment) {
        const apptChild = Array.isArray(copy.appointment.child) ? copy.appointment.child[0] : copy.appointment.child
        copy.child = apptChild || null
    }

    // normalize caregiver profiles if present
    if (copy.child && copy.child.caregiver) {
        const cg = copy.child.caregiver
        if (cg.profiles) {
            copy.child.caregiver.profiles = Array.isArray(cg.profiles) ? cg.profiles[0] : cg.profiles
        }
    }

    // normalize doctor/other joined profiles
    if (copy.doctor && copy.doctor.profiles) {
        copy.doctor.profiles = Array.isArray(copy.doctor.profiles) ? copy.doctor.profiles[0] : copy.doctor.profiles
    }

    return copy
}
