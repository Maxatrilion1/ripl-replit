import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ArrowLeft, ArrowRight, Clock } from 'lucide-react';
import { useSessionFlowStore } from './store';
import { roundUpToQuarter, buildQuarterHours, formatTimeForDisplay } from './helpers/date';
import { cn } from '@/lib/utils';

export const StepPickTime = () => {
  const navigate = useNavigate();
  const { selectedDate, selectedTime, setTime } = useSessionFlowStore();
  const [availableTimes, setAvailableTimes] = useState<string[]>([]);

  useEffect(() => {
    if (!selectedDate) {
      navigate('/create-session/day');
      return;
    }

    const isToday = selectedDate.toDateString() === new Date().toDateString();
    
    if (isToday) {
      // For today, start from next quarter hour
      const nextQuarter = roundUpToQuarter();
      const startTime = `${String(nextQuarter.getHours()).padStart(2, '0')}:${String(nextQuarter.getMinutes()).padStart(2, '0')}`;
      setAvailableTimes(buildQuarterHours(startTime, "23:45"));
      
      // Auto-select the first available time if none selected
      if (!selectedTime) {
        setTime(startTime);
      }
    } else {
      // For future days, show all times from 8 AM
      setAvailableTimes(buildQuarterHours("08:00", "22:00"));
      
      // Auto-select 9 AM if none selected
      if (!selectedTime) {
        setTime("09:00");
      }
    }
  }, [selectedDate, selectedTime, setTime]);

  const handleBack = () => {
    navigate('/create-session/day');
  };

  const handleNext = () => {
    if (selectedTime) {
      navigate('/create-session/confirm');
    }
  };

  const handleSelectTime = (time: string) => {
    setTime(time);
  };

  const isToday = selectedDate?.toDateString() === new Date().toDateString();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Progress indicator */}
        <div className="flex justify-center space-x-2">
          <div className="w-2 h-2 rounded-full bg-primary" />
          <div className="w-2 h-2 rounded-full bg-primary" />
          <div className="w-2 h-2 rounded-full bg-primary" />
          <div className="w-2 h-2 rounded-full bg-muted" />
        </div>

        <Card className="shadow-lg border-0 bg-card/95 backdrop-blur">
          <CardHeader className="text-center space-y-4">
            <div className="flex items-center justify-center gap-2 mb-4">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-primary to-accent flex items-center justify-center">
                <Clock className="w-6 h-6 text-white" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold">
              What time works best?
            </CardTitle>
            <p className="text-muted-foreground">
              {isToday ? 'Available times for today' : `Pick a start time for ${selectedDate?.toLocaleDateString(undefined, { weekday: 'long' })}`}
            </p>
          </CardHeader>

          <CardContent className="space-y-6">
            <ScrollArea className="h-64 w-full rounded-md border p-2">
              <div className="grid grid-cols-3 gap-2">
                {availableTimes.map((time) => (
                  <Button
                    key={time}
                    variant={selectedTime === time ? "default" : "outline"}
                    size="sm"
                    className={cn(
                      "h-10 text-sm",
                      selectedTime === time && "ring-2 ring-primary/20"
                    )}
                    onClick={() => handleSelectTime(time)}
                  >
                    {formatTimeForDisplay(time)}
                  </Button>
                ))}
              </div>
            </ScrollArea>

            {selectedTime && (
              <div className="text-center">
                <Badge variant="secondary" className="text-sm">
                  Selected: {formatTimeForDisplay(selectedTime)}
                </Badge>
              </div>
            )}

            <div className="flex gap-3">
              <Button 
                variant="outline"
                onClick={handleBack}
                className="flex-1 h-12"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <Button 
                onClick={handleNext}
                disabled={!selectedTime}
                className="flex-1 h-12"
              >
                Continue
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};