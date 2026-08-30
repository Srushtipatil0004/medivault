import {
  fetchMedicines,
  addMedicine,
  updateMedicine,
  deleteMedicine,
  takeDose,
} from "./medicines";
import {
  fetchAppointments,
  addAppointment,
  updateAppointment,
  deleteAppointment,
} from "./appointments";
import {
  fetchRecords,
  addRecord,
  deleteRecord,
} from "./medicalRecords";
import {
  fetchDiet,
  addDiet,
  deleteDiet,
} from "./diet";
import {
  fetchHealthReadings,
  addHealthReading,
  deleteHealthReading,
} from "./healthMonitoring";
import {
  fetchPreferences,
  updatePreference,
} from "./preferences";

async function waitForData(fetchFn, uid) {
  return new Promise((resolve, reject) => {
    let cancelled = false;
    const unsubscribe = fetchFn(uid, (data) => {
      if (!cancelled) {
        unsubscribe();
        resolve(data);
      }
    }, (err) => {
      if (!cancelled) {
        unsubscribe();
        reject(err);
      }
    });
    return () => { cancelled = true; };
  });
}

export const aiActions = {
  async readMedicines(uid) {
    return waitForData(fetchMedicines, uid);
  },

  async readAppointments(uid) {
    return waitForData(fetchAppointments, uid);
  },

  async readMedicalRecords(uid) {
    return waitForData(fetchRecords, uid);
  },

  async readDiet(uid) {
    return waitForData(fetchDiet, uid);
  },

  async readHealthReadings(uid) {
    return waitForData(fetchHealthReadings, uid);
  },

  async readPreferences(uid) {
    return waitForData(fetchPreferences, uid);
  },

  async addMedicine(uid, data) {
    const required = ["name", "dosage", "frequency", "timingType", "totalTablets", "tabletsPerDose"];
    for (const field of required) {
      if (!data[field] && data[field] !== 0) {
        throw new Error(`Missing required field: ${field}`);
      }
    }
    return addMedicine(uid, data);
  },

  async updateMedicine(uid, medicineId, data) {
    if (!medicineId) throw new Error("medicineId is required");
    return updateMedicine(uid, medicineId, data);
  },

  async deleteMedicine(uid, medicineId) {
    if (!medicineId) throw new Error("medicineId is required");
    return deleteMedicine(uid, medicineId);
  },

  async takeDose(uid, medicineId) {
    const medicines = await this.readMedicines(uid);
    const medicine = medicines.find(m => m.id === medicineId);
    if (!medicine) throw new Error("Medicine not found");
    return takeDose(uid, medicine);
  },

  async addAppointment(uid, data) {
    const required = ["doctorName", "hospital", "appointmentDate", "appointmentTime"];
    for (const field of required) {
      if (!data[field]) throw new Error(`Missing required field: ${field}`);
    }
    return addAppointment(uid, data);
  },

  async updateAppointment(uid, appointmentId, data) {
    if (!appointmentId) throw new Error("appointmentId is required");
    return updateAppointment(uid, appointmentId, data);
  },

  async deleteAppointment(uid, appointmentId) {
    if (!appointmentId) throw new Error("appointmentId is required");
    return deleteAppointment(uid, appointmentId);
  },

  async addMedicalRecord(uid, data) {
    const required = ["title", "type", "date", "hospital", "doctor"];
    for (const field of required) {
      if (!data[field]) throw new Error(`Missing required field: ${field}`);
    }
    return addRecord(uid, data);
  },

  async deleteMedicalRecord(uid, recordId) {
    if (!recordId) throw new Error("recordId is required");
    return deleteRecord(uid, recordId);
  },

  async addDietEntry(uid, data) {
    const required = ["mealType", "foodName", "date", "time"];
    for (const field of required) {
      if (!data[field]) throw new Error(`Missing required field: ${field}`);
    }
    return addDiet(uid, data);
  },

  async deleteDietEntry(uid, entryId) {
    if (!entryId) throw new Error("entryId is required");
    return deleteDiet(uid, entryId);
  },

  async addHealthReading(uid, data) {
    const required = ["date", "time"];
    for (const field of required) {
      if (!data[field]) throw new Error(`Missing required field: ${field}`);
    }
    return addHealthReading(uid, data);
  },

  async deleteHealthReading(uid, readingId) {
    if (!readingId) throw new Error("readingId is required");
    return deleteHealthReading(uid, readingId);
  },

  async updateUserPreference(uid, field, value) {
    const validFields = ["usualBreakfastTime", "usualLunchTime", "usualDinnerTime"];
    if (!validFields.includes(field)) {
      throw new Error(`Invalid preference field: ${field}`);
    }
    return updatePreference(uid, field, value);
  },
};

export function getActionSchema() {
  return {
    readMedicines: {
      description: "Read all medicines for the current user",
      parameters: { type: "object", properties: {} },
    },
    readAppointments: {
      description: "Read all appointments for the current user",
      parameters: { type: "object", properties: {} },
    },
    readMedicalRecords: {
      description: "Read all medical records for the current user",
      parameters: { type: "object", properties: {} },
    },
    readDiet: {
      description: "Read all diet entries for the current user",
      parameters: { type: "object", properties: {} },
    },
    readHealthReadings: {
      description: "Read all health monitoring readings for the current user",
      parameters: { type: "object", properties: {} },
    },
    readPreferences: {
      description: "Read user meal time preferences",
      parameters: { type: "object", properties: {} },
    },
    addMedicine: {
      description: "Add a new medicine",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string", description: "Medicine name" },
          dosage: { type: "string", description: "Dosage (e.g., '500mg')" },
          frequency: { type: "string", description: "Frequency (e.g., 'daily', 'twice daily')" },
          timingType: { type: "string", enum: ["exact", "relative"], description: "Timing type" },
          exactTime: { type: "string", description: "HH:mm format, required if timingType is 'exact'" },
          times: { type: "array", items: { type: "string" }, description: "Array of times HH:mm, used if timingType is 'relative'" },
          reminderEnabled: { type: "boolean", description: "Enable reminders" },
          reminderLeadMinutes: { type: "number", description: "Minutes before dose to remind" },
          doctorInstruction: { type: "string", description: "Doctor's instructions" },
          startDate: { type: "string", description: "YYYY-MM-DD format" },
          endDate: { type: "string", description: "YYYY-MM-DD format" },
          notes: { type: "string", description: "Additional notes" },
          totalTablets: { type: "number", description: "Total tablets in package" },
          tabletsPerDose: { type: "number", description: "Tablets taken per dose" },
        },
        required: ["name", "dosage", "frequency", "timingType", "totalTablets", "tabletsPerDose"],
      },
    },
    updateMedicine: {
      description: "Update an existing medicine",
      parameters: {
        type: "object",
        properties: {
          medicineId: { type: "string", description: "ID of medicine to update" },
          name: { type: "string" },
          dosage: { type: "string" },
          frequency: { type: "string" },
          timingType: { type: "string", enum: ["exact", "relative"] },
          exactTime: { type: "string" },
          times: { type: "array", items: { type: "string" } },
          reminderEnabled: { type: "boolean" },
          reminderLeadMinutes: { type: "number" },
          doctorInstruction: { type: "string" },
          startDate: { type: "string" },
          endDate: { type: "string" },
          notes: { type: "string" },
          totalTablets: { type: "number" },
          tabletsPerDose: { type: "number" },
        },
        required: ["medicineId"],
      },
    },
    deleteMedicine: {
      description: "Delete a medicine",
      parameters: {
        type: "object",
        properties: {
          medicineId: { type: "string", description: "ID of medicine to delete" },
        },
        required: ["medicineId"],
      },
    },
    takeDose: {
      description: "Record that a dose was taken",
      parameters: {
        type: "object",
        properties: {
          medicineId: { type: "string", description: "ID of medicine" },
        },
        required: ["medicineId"],
      },
    },
    addAppointment: {
      description: "Add a new appointment",
      parameters: {
        type: "object",
        properties: {
          doctorName: { type: "string" },
          hospital: { type: "string" },
          appointmentDate: { type: "string", description: "YYYY-MM-DD format" },
          appointmentTime: { type: "string", description: "HH:mm format" },
          reason: { type: "string" },
          notes: { type: "string" },
        },
        required: ["doctorName", "hospital", "appointmentDate", "appointmentTime"],
      },
    },
    updateAppointment: {
      description: "Update an existing appointment",
      parameters: {
        type: "object",
        properties: {
          appointmentId: { type: "string" },
          doctorName: { type: "string" },
          hospital: { type: "string" },
          appointmentDate: { type: "string" },
          appointmentTime: { type: "string" },
          reason: { type: "string" },
          notes: { type: "string" },
        },
        required: ["appointmentId"],
      },
    },
    deleteAppointment: {
      description: "Delete an appointment",
      parameters: {
        type: "object",
        properties: {
          appointmentId: { type: "string" },
        },
        required: ["appointmentId"],
      },
    },
    addMedicalRecord: {
      description: "Add a new medical record",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string" },
          type: { type: "string", description: "Type of record (e.g., 'Lab Report', 'Prescription')" },
          date: { type: "string", description: "YYYY-MM-DD format" },
          hospital: { type: "string" },
          doctor: { type: "string" },
        },
        required: ["title", "type", "date", "hospital", "doctor"],
      },
    },
    deleteMedicalRecord: {
      description: "Delete a medical record",
      parameters: {
        type: "object",
        properties: {
          recordId: { type: "string" },
        },
        required: ["recordId"],
      },
    },
    addDietEntry: {
      description: "Add a new diet entry",
      parameters: {
        type: "object",
        properties: {
          mealType: { type: "string", enum: ["breakfast", "lunch", "dinner", "snack"] },
          foodName: { type: "string" },
          date: { type: "string", description: "YYYY-MM-DD format" },
          time: { type: "string", description: "HH:mm format" },
          notes: { type: "string" },
        },
        required: ["mealType", "foodName", "date", "time"],
      },
    },
    deleteDietEntry: {
      description: "Delete a diet entry",
      parameters: {
        type: "object",
        properties: {
          entryId: { type: "string" },
        },
        required: ["entryId"],
      },
    },
    addHealthReading: {
      description: "Add a new health reading (vitals)",
      parameters: {
        type: "object",
        properties: {
          date: { type: "string", description: "YYYY-MM-DD format" },
          time: { type: "string", description: "HH:mm format" },
          systolic: { type: "number", description: "Blood pressure systolic" },
          diastolic: { type: "number", description: "Blood pressure diastolic" },
          heartRate: { type: "number" },
          bloodSugar: { type: "number" },
          spo2: { type: "number" },
          temperature: { type: "number" },
          weight: { type: "number" },
          notes: { type: "string" },
        },
        required: ["date", "time"],
      },
    },
    deleteHealthReading: {
      description: "Delete a health reading",
      parameters: {
        type: "object",
        properties: {
          readingId: { type: "string" },
        },
        required: ["readingId"],
      },
    },
    updateUserPreference: {
      description: "Update a user meal time preference",
      parameters: {
        type: "object",
        properties: {
          field: { type: "string", enum: ["usualBreakfastTime", "usualLunchTime", "usualDinnerTime"] },
          value: { type: "string", description: "HH:mm format" },
        },
        required: ["field", "value"],
      },
    },
  };
}