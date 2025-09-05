import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, ArrowRight, Calendar } from 'lucide-react';
import { useSessionFlowStore } from './store';
import { getSixOptions, formatDateForDisplay } from './helpers/date';

export const StepPickDay = () => {
  const navigate = useNavigate();
  const { selectedDate, setDate } = useSessionFlowStore();
  
  const dayOptions = getSixOptions();

  const handleBack = () => {
    navigate('/create-session/cafe');
  };

  const handleNext = () => {
    if (selectedDate) {
      navigate('/create-session/time');
    }
  };

  const handleSelectDate = (date: Date) => {
    setDate(date);
  };

  const isSelected = (date: Date) => {
    return selectedDate?.toDateString() === date.toDateString();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Progress indicator */}
        <div className="flex justify-center space-x-2">
          <div className="w-2 h-2 rounded-full bg-primary" />
          <div className="w-2 h-2 rounded-full bg-primary" />
          <div className="w-2 h-2 rounded-full bg-muted" />
          <div className="w-2 h-2 rounded-full bg-muted" />
        </div>

        <Card className="shadow-lg border-0 bg-card/95 backdrop-blur">
          <CardHeader className="text-center space-y-4">
            <div className="flex items-center justify-center gap-2 mb-4">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-primary to-accent flex items-center justify-center">
                <Calendar className="w-6 h-6 text-white" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold">
              When would you like to meet?
            </CardTitle>
            <p className="text-muted-foreground">
              Pick a day for your coworking session
            </p>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-3">
              {dayOptions.map((option, index) => (
                <Button
                  key={index}
                  variant={isSelected(option.date) ? "default" : "outline"}
                  className={cn(
                    "h-16 flex flex-col items-center justify-center text-center p-3",
                    isSelected(option.date) && "ring-2 ring-primary/20"
                  )}
                  onClick={() => handleSelectDate(option.date)}
                >
                  <span className="font-semibold text-sm">
                    {option.label}
                  </span>
                  <span className="text-xs opacity-75">
                    {option.date.toLocaleDateString(undefined, { 
                      month: 'short', 
                      day: 'numeric' 
                    })}
                  </span>
                </Button>
              ))}
            </div>

            {selectedDate && (
              <div className="text-center">
                <Badge variant="secondary" className="text-sm">
                  Selected: {formatDateForDisplay(selectedDate)}
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
                disabled={!selectedDate}
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