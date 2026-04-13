export const agriMath = {
  // Returns total product needed for a full tank
  calculateTankMix: (tankSize: number, appRate: number) => {
    return tankSize * appRate; 
  },
  
  // Converts Metric L/Ha to American GPA (Gallons Per Acre)
  lhaToGpa: (lha: number) => lha * 0.1069,
  
  // Converts American GPA to Metric L/Ha
  gpaToLha: (gpa: number) => gpa * 9.354
};
